<?php
namespace DriveVaultEDD\Services;

defined( 'ABSPATH' ) || exit;

/**
 * Easy Digital Downloads Download Interceptor and Secure File Streamer.
 */
class EddDownloadHandler {

	/**
	 * Google Drive Client.
	 *
	 * @var GoogleDriveClient
	 */
	protected $drive;

	/**
	 * Constructor.
	 *
	 * @param GoogleDriveClient $drive
	 */
	public function __construct( GoogleDriveClient $drive ) {
		$this->drive = $drive;
		$this->init_hooks();
	}

	/**
	 * Register EDD download hooks.
	 */
	private function init_hooks() {
		// Hook into verified EDD download execution before standard local file handler.
		add_action( 'edd_process_verified_download', array( $this, 'process_verified_download' ), 5, 4 );
	}

	/**
	 * Handle verified EDD download request.
	 *
	 * @param int    $download_id Download post ID.
	 * @param string $email       Customer email address.
	 * @param int    $payment_id  EDD Payment / Order ID.
	 * @param array  $args        Download execution arguments.
	 */
	public function process_verified_download( $download_id, $email, $payment_id, $args ) {
		$download_files = function_exists( 'edd_get_download_files' ) ? edd_get_download_files( $download_id ) : array();
		$file_key       = isset( $args['file_key'] ) ? (int) $args['file_key'] : 0;
		$requested_file = isset( $download_files[ $file_key ]['file'] ) ? $download_files[ $file_key ]['file'] : '';
		$custom_name    = isset( $download_files[ $file_key ]['name'] ) ? $download_files[ $file_key ]['name'] : '';

		$file_id = GoogleDriveClient::parse_file_id( $requested_file );
		if ( ! $file_id ) {
			return; // Not a Google Drive file, let EDD or other add-ons handle it.
		}

		$settings        = get_option( defined( 'DRIVEVAULT_EDD_OPTION_SETTINGS' ) ? DRIVEVAULT_EDD_OPTION_SETTINGS : 'drivevault_edd_settings', array() );
		$download_method = ! empty( $settings['download_method'] ) ? $settings['download_method'] : 'redirect';

		// Resolve user ID
		$user_id = get_current_user_id();
		if ( empty( $user_id ) && function_exists( 'edd_get_payment_meta_user_id' ) ) {
			$user_id = (int) edd_get_payment_meta_user_id( $payment_id );
		}

		// Record in native EDD download logs & respect file download limits
		$price_id = isset( $args['price_id'] ) ? (int) $args['price_id'] : false;
		if ( function_exists( 'edd_record_download_in_log' ) ) {
			$ip     = function_exists( 'edd_get_ip' ) ? edd_get_ip() : '';
			$log_id = edd_record_download_in_log( $download_id, $file_key, array(), $ip, $payment_id, $price_id );

			if ( function_exists( 'edd_file_download_log_exceeds_limit' ) && edd_file_download_log_exceeds_limit( $log_id ) ) {
				if ( function_exists( 'edd_delete_file_download_log' ) ) {
					edd_delete_file_download_log( $log_id );
				}
				if ( function_exists( 'edd_die_file_download_limit_reached' ) ) {
					edd_die_file_download_limit_reached();
				}
				wp_die(
					esc_html__( 'Sorry, you have reached your download limit for this item.', 'drivevault-for-easy-digital-download' ),
					esc_html__( 'Download Limit Reached', 'drivevault-for-easy-digital-download' ),
					403
				);
			}
		}

		// Fetch file metadata from Google Drive
		$file_meta = $this->drive->get_file( $file_id );
		if ( is_wp_error( $file_meta ) ) {
			$error_message = sprintf(
				/* translators: %s: Error message from Google Drive API */
				__( 'Error accessing Google Drive file: %s', 'drivevault-for-easy-digital-download' ),
				$file_meta->get_error_message()
			);

			$this->log_download( array(
				'order_id'        => $payment_id,
				'product_id'      => $download_id,
				'download_id'     => $download_id,
				'file_id'         => $file_id,
				'file_name'       => ! empty( $custom_name ) ? $custom_name : $file_id,
				'provider'        => 'gdrive',
				'customer_email'  => $email,
				'user_id'         => $user_id,
				'download_method' => $download_method,
				'status'          => 'failed',
				'error_message'   => $file_meta->get_error_message(),
			) );

			$this->render_error_page(
				$error_message,
				__( 'Download Unavailable', 'drivevault-for-easy-digital-download' ),
				502
			);
		}

		// Ensure true filename and extension from Google Drive metadata is preserved
		if ( ! empty( $file_meta['name'] ) ) {
			$real_filename = $file_meta['name'];
		} elseif ( ! empty( $custom_name ) && $custom_name !== $file_id && $custom_name !== basename( $requested_file ) ) {
			$real_filename = $custom_name;
		} else {
			$real_filename = 'download';
		}

		$raw_mime_type = ! empty( $file_meta['mimeType'] ) ? $file_meta['mimeType'] : 'application/octet-stream';
		$mime_type     = sanitize_mime_type( $raw_mime_type );
		if ( empty( $mime_type ) ) {
			$mime_type = 'application/octet-stream';
		}

		// Allow extensions to intercept download.
		$handled = apply_filters(
			'drivevault_edd_pre_handle_download',
			apply_filters( 'drivevault_pre_handle_download', false, $file_id, $file_meta, $real_filename, $download_method ),
			$file_id,
			$file_meta,
			$real_filename,
			$download_method
		);
		if ( $handled ) {
			$this->log_download( array(
				'order_id'        => $payment_id,
				'product_id'      => $download_id,
				'download_id'     => $download_id,
				'file_id'         => $file_id,
				'file_name'       => $real_filename,
				'provider'        => 'gdrive',
				'customer_email'  => $email,
				'user_id'         => $user_id,
				'download_method' => $download_method,
				'status'          => 'completed',
			) );
			exit;
		}

		// Direct Google Drive native download delivery.
		// If item is a folder, bundle into ZIP or fallback to folder view link.
		if ( ! empty( $file_meta['mimeType'] ) && 'application/vnd.google-apps.folder' === $file_meta['mimeType'] ) {
			if ( class_exists( '\ZipArchive' ) ) {
				$this->log_download( array(
					'order_id'        => $payment_id,
					'product_id'      => $download_id,
					'download_id'     => $download_id,
					'file_id'         => $file_id,
					'file_name'       => $real_filename . '.zip',
					'provider'        => 'gdrive',
					'customer_email'  => $email,
					'user_id'         => $user_id,
					'download_method' => 'zip_stream',
					'status'          => 'completed',
				) );
				$this->stream_folder_zip( $file_id, $real_filename );
				exit;
			}

			if ( ! empty( $file_meta['webViewLink'] ) ) {
				$this->log_download( array(
					'order_id'        => $payment_id,
					'product_id'      => $download_id,
					'download_id'     => $download_id,
					'file_id'         => $file_id,
					'file_name'       => $real_filename,
					'provider'        => 'gdrive',
					'customer_email'  => $email,
					'user_id'         => $user_id,
					'download_method' => 'redirect',
					'status'          => 'completed',
				) );
				$this->redirect_to( $file_meta['webViewLink'] );
			}
		}

		// Direct Google Drive native download delivery (Redirect mode).
		if ( ! empty( $file_meta['webContentLink'] ) ) {
			$download_url = $file_meta['webContentLink'];
		} else {
			$token = $this->drive->get_access_token();
			if ( is_wp_error( $token ) ) {
				$this->render_error_page(
					__( 'Could not generate secure Google Drive download link. Please reconnect your account.', 'drivevault-for-easy-digital-download' ),
					__( 'Download Error', 'drivevault-for-easy-digital-download' ),
					500
				);
			}
			$download_url = add_query_arg(
				array(
					'alt'          => 'media',
					'access_token' => $token,
				),
				'https://www.googleapis.com/drive/v3/files/' . urlencode( $file_id )
			);
		}

		$this->log_download( array(
			'order_id'        => $payment_id,
			'product_id'      => $download_id,
			'download_id'     => $download_id,
			'file_id'         => $file_id,
			'file_name'       => $real_filename,
			'provider'        => 'gdrive',
			'customer_email'  => $email,
			'user_id'         => $user_id,
			'download_method' => $download_method,
			'status'          => 'completed',
		) );

		$this->redirect_to( $download_url );
	}

	/**
	 * Perform a safe HTTP redirect to Google Drive download URL.
	 *
	 * @param string $url
	 */
	protected function redirect_to( $url ) {
		while ( ob_get_level() ) {
			ob_end_clean();
		}

		$parsed = wp_parse_url( $url );
		if ( ! empty( $parsed['host'] ) ) {
			$redirect_host = $parsed['host'];
			add_filter(
				'allowed_redirect_hosts',
				function ( $hosts ) use ( $redirect_host ) {
					$hosts[] = $redirect_host;
					return $hosts;
				}
			);
		}

		header( 'X-Robots-Tag: noindex, nofollow', true );
		wp_safe_redirect( esc_url_raw( $url ), 302 );
		exit;
	}

	/**
	 * Stream folder contents bundled on-the-fly as a ZIP archive.
	 *
	 * @param string $folder_id
	 * @param string $folder_name
	 */
	protected function stream_folder_zip( $folder_id, $folder_name ) {
		while ( ob_get_level() ) {
			ob_end_clean();
		}

		if ( function_exists( 'apache_setenv' ) ) {
			@apache_setenv( 'no-gzip', '1' );
		}
		// phpcs:ignore Squiz.PHP.DiscouragedFunctions.Discouraged -- Disabled output compression for ZIP binary transfer.
		@ini_set( 'zlib.output_compression', 'Off' );
		// phpcs:ignore Squiz.PHP.DiscouragedFunctions.Discouraged -- Disabled time limit for large downloads.
		@set_time_limit( 0 );

		$temp_dir = get_temp_dir();
		$zip_file = wp_tempnam( 'dv_edd_folder_', $temp_dir );
		if ( ! $zip_file ) {
			$this->render_error_page(
				__( 'Could not create temporary archive file.', 'drivevault-for-easy-digital-download' ),
				__( 'Download Error', 'drivevault-for-easy-digital-download' ),
				500
			);
		}

		$zip = new \ZipArchive();
		if ( true !== $zip->open( $zip_file, \ZipArchive::CREATE | \ZipArchive::OVERWRITE ) ) {
			wp_delete_file( $zip_file );
			$this->render_error_page(
				__( 'Failed to initialize ZIP archive.', 'drivevault-for-easy-digital-download' ),
				__( 'Download Error', 'drivevault-for-easy-digital-download' ),
				500
			);
		}

		$files_result = $this->drive->list_files( array(
			'folder_id'   => $folder_id,
			'filter_type' => 'files',
			'page_size'   => 100,
		), true );

		if ( is_wp_error( $files_result ) || empty( $files_result['files'] ) ) {
			$zip->close();
			wp_delete_file( $zip_file );
			$this->render_error_page(
				__( 'The requested folder is empty or inaccessible.', 'drivevault-for-easy-digital-download' ),
				__( 'Folder Empty', 'drivevault-for-easy-digital-download' ),
				404
			);
		}

		$token = $this->drive->get_access_token();
		if ( is_wp_error( $token ) ) {
			$zip->close();
			wp_delete_file( $zip_file );
			$this->render_error_page(
				__( 'Authentication error while reading folder files.', 'drivevault-for-easy-digital-download' ),
				__( 'Download Error', 'drivevault-for-easy-digital-download' ),
				500
			);
		}

		foreach ( $files_result['files'] as $child_file ) {
			$download_url = add_query_arg(
				array( 'alt' => 'media' ),
				'https://www.googleapis.com/drive/v3/files/' . urlencode( $child_file['id'] )
			);

			$response = wp_remote_get( $download_url, array(
				'headers' => array( 'Authorization' => 'Bearer ' . $token ),
				'timeout' => 60,
			) );

			if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
				$file_contents = wp_remote_retrieve_body( $response );
				$zip->addFromString( $child_file['name'], $file_contents );
			}
		}

		$zip->close();

		if ( ! file_exists( $zip_file ) || 0 === filesize( $zip_file ) ) {
			wp_delete_file( $zip_file );
			$this->render_error_page(
				__( 'Failed to compile folder contents into ZIP archive.', 'drivevault-for-easy-digital-download' ),
				__( 'Download Error', 'drivevault-for-easy-digital-download' ),
				500
			);
		}

		$download_filename = sanitize_file_name( $folder_name ) . '.zip';
		$filesize          = filesize( $zip_file );

		header( 'Content-Type: application/zip' );
		header( 'Content-Disposition: attachment; filename="' . $download_filename . '"' );
		header( 'Content-Length: ' . $filesize );
		header( 'Cache-Control: private, must-revalidate, post-check=0, pre-check=0, max-age=0' );
		header( 'Pragma: public' );
		header( 'Expires: 0' );
		header( 'X-Robots-Tag: noindex, nofollow', true );

		readfile( $zip_file ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile
		wp_delete_file( $zip_file );
		exit;
	}

	/**
	 * Render error page for failed downloads.
	 *
	 * @param string $message
	 * @param string $title
	 * @param int    $status_code
	 */
	protected function render_error_page( $message, $title, $status_code = 500 ) {
		while ( ob_get_level() ) {
			ob_end_clean();
		}

		status_header( $status_code );
		nocache_headers();

		$template_args = array(
			'message'     => $message,
			'title'       => $title,
			'status_code' => $status_code,
			'site_name'   => get_bloginfo( 'name' ),
			'home_url'    => home_url( '/' ),
			'account_url' => function_exists( 'edd_get_history_page_uri' ) ? edd_get_history_page_uri() : home_url( '/' ),
		);

		drivevault_edd_get_template( 'download-error.php', $template_args );
		exit;
	}

	/**
	 * Log download event firing both prefixed and legacy hooks.
	 *
	 * @param array $log_data
	 */
	protected function log_download( array $log_data ) {
		do_action( 'drivevault_edd_log_download', $log_data );
		do_action( 'drivevault_log_download', $log_data );
	}
}
