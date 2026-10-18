<?php
namespace DriveVaultEDD\API\Controllers;

use DriveVaultEDD\Services\GoogleDriveClient;
use DriveVaultEDD\Services\OAuthManager;
use DriveVaultEDD\Helpers\Cache;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * REST API Drive Files & Quota Controller.
 */
class DriveController {

	/**
	 * Google Drive Client.
	 *
	 * @var GoogleDriveClient
	 */
	protected $drive;

	/**
	 * OAuth Manager.
	 *
	 * @var OAuthManager
	 */
	protected $oauth;

	/**
	 * Constructor.
	 *
	 * @param GoogleDriveClient $drive
	 * @param OAuthManager      $oauth
	 */
	public function __construct( GoogleDriveClient $drive, OAuthManager $oauth ) {
		$this->drive = $drive;
		$this->oauth = $oauth;
	}

	/**
	 * Register routes.
	 *
	 * @param string $namespace
	 */
	public function register_routes( $namespace = 'drivevault/v1' ) {
		register_rest_route( $namespace, '/drive/files', array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_files' ),
			'permission_callback' => array( $this, 'check_editor_permissions' ),
			'args'                => array(
				'folder_id'   => array(
					'default'           => 'root',
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'search'      => array(
					'default'           => '',
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'page_token'  => array(
					'default'           => '',
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'page_size'   => array(
					'default'           => 40,
					'type'              => 'integer',
					'sanitize_callback' => 'absint',
				),
				'filter_type' => array(
					'default'           => 'all',
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'refresh'     => array(
					'default' => false,
					'type'    => 'boolean',
				),
			),
		) );

		register_rest_route( $namespace, '/drive/quota', array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => array( $this, 'get_quota' ),
			'permission_callback' => array( $this, 'check_admin_permissions' ),
		) );

		register_rest_route( $namespace, '/drive/flush-cache', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'flush_cache' ),
			'permission_callback' => array( $this, 'check_admin_permissions' ),
		) );

		register_rest_route( $namespace, '/tools/verify-file', array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => array( $this, 'verify_file' ),
			'permission_callback' => array( $this, 'check_editor_permissions' ),
			'args'                => array(
				'file_url' => array(
					'required'          => true,
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		) );
	}

	/**
	 * Admin permissions check.
	 *
	 * @return bool
	 */
	public function check_admin_permissions() {
		return current_user_can( 'manage_shop_settings' ) || current_user_can( 'manage_options' );
	}

	/**
	 * Editor permissions check.
	 *
	 * @return bool
	 */
	public function check_editor_permissions() {
		return current_user_can( 'edit_downloads' ) || current_user_can( 'manage_shop_settings' ) || current_user_can( 'manage_options' );
	}

	/**
	 * Get Google Drive files.
	 */
	public function get_files( WP_REST_Request $request ) {
		if ( ! $this->oauth->is_connected() ) {
			return new WP_Error( 'not_connected', __( 'Google Drive is not connected.', 'drivevault-for-easy-digital-download' ), array( 'status' => 400 ) );
		}

		$args = array(
			'folder_id'   => $request->get_param( 'folder_id' ),
			'search'      => $request->get_param( 'search' ),
			'page_token'  => $request->get_param( 'page_token' ),
			'page_size'   => $request->get_param( 'page_size' ),
			'filter_type' => $request->get_param( 'filter_type' ),
		);

		$force_refresh = (bool) $request->get_param( 'refresh' );

		$result = $this->drive->list_files( $args, $force_refresh );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Get Google Drive quota.
	 */
	public function get_quota( WP_REST_Request $request ) {
		if ( ! $this->oauth->is_connected() ) {
			return new WP_Error( 'not_connected', __( 'Google Drive is not connected.', 'drivevault-for-easy-digital-download' ), array( 'status' => 400 ) );
		}

		$result = $this->drive->get_about();
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return new WP_REST_Response( $result, 200 );
	}

	/**
	 * Flush transient caches.
	 */
	public function flush_cache( WP_REST_Request $request ) {
		Cache::flush_all();

		return new WP_REST_Response( array(
			'success' => true,
			'message' => __( 'Cache cleared successfully.', 'drivevault-for-easy-digital-download' ),
		), 200 );
	}

	/**
	 * Verify cloud file URL and fetch status/metadata for download editor pill.
	 *
	 * @param WP_REST_Request $request
	 * @return WP_REST_Response
	 */
	public function verify_file( WP_REST_Request $request ) {
		$file_url = (string) $request->get_param( 'file_url' );
		$file_id  = GoogleDriveClient::parse_file_id( $file_url );

		if ( ! $file_id ) {
			return new WP_REST_Response( array( 'status' => 'cloud' ), 200 );
		}

		if ( ! $this->oauth->is_connected() ) {
			return new WP_REST_Response( array(
				'status'  => 'unauthorized',
				'message' => __( 'Google Drive is not connected.', 'drivevault-for-easy-digital-download' ),
			), 200 );
		}

		$file = $this->drive->get_file( $file_id );
		if ( is_wp_error( $file ) ) {
			$status_code = (int) $file->get_error_data();
			if ( 404 === $status_code ) {
				return new WP_REST_Response( array(
					'status'  => 'missing',
					'message' => __( 'File not found on Google Drive.', 'drivevault-for-easy-digital-download' ),
				), 200 );
			}
			return new WP_REST_Response( array(
				'status'  => 'unauthorized',
				'message' => $file->get_error_message(),
			), 200 );
		}

		$raw_size = ! empty( $file['size'] ) ? (float) $file['size'] : 0;

		return new WP_REST_Response( array(
			'status'         => 'healthy',
			'name'           => ! empty( $file['name'] ) ? $file['name'] : '',
			'size'           => $raw_size,
			'formatted_size' => \DriveVaultEDD\Helpers\Formatter::format_bytes( $raw_size ),
			'web_view_link'  => ! empty( $file['webViewLink'] ) ? $file['webViewLink'] : '',
		), 200 );
	}
}

