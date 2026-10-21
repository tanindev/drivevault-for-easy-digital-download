<?php
namespace DriveVaultEDD\Admin;

use DriveVaultEDD\Services\OAuthManager;

defined( 'ABSPATH' ) || exit;

/**
 * Admin Assets Handler for Easy Digital Downloads.
 */
class Assets {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Enqueue scripts and styles targeted by screen.
	 *
	 * @param string $hook Admin page hook.
	 */
	public function enqueue_assets( $hook ) {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;

		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$page_param = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		$is_settings_page = (
			'download_page_' . DRIVEVAULT_EDD_PAGE_SLUG === $hook
			|| ( $screen && 'download_page_' . DRIVEVAULT_EDD_PAGE_SLUG === $screen->id )
			|| DRIVEVAULT_EDD_PAGE_SLUG === $page_param
		);
		$is_download_page = ( $screen && 'download' === $screen->post_type );

		if ( ! $is_settings_page && ! $is_download_page ) {
			return;
		}

		$oauth = new OAuthManager();

		// Common localized data for React apps.
		$localized_data = array(
			'restUrl'           => esc_url_raw( rest_url( 'drivevault-edd/v1/' ) ),
			'restUrlEDD'        => esc_url_raw( rest_url( 'drivevault-edd/v1/' ) ),
			'pageSlug'          => DRIVEVAULT_EDD_PAGE_SLUG,
			'nonce'             => wp_create_nonce( 'wp_rest' ),
			'isConnected'       => $oauth->is_connected(),
			'gdriveSettingsUrl' => admin_url( 'edit.php?post_type=download&page=' . DRIVEVAULT_EDD_PAGE_SLUG ),
			'pluginUrl'         => DRIVEVAULT_EDD_URL,
			'assetsUrl'         => DRIVEVAULT_EDD_ASSETS_URL,
			'i18n'              => array(
				'addDriveVaultFile' => __( 'Add DriveVault File', 'drivevault-for-easy-digital-downloads' ),
				'chooseFromCloud'   => __( 'Add DriveVault File', 'drivevault-for-easy-digital-downloads' ),
				'modalTitle'        => __( 'Select Downloadable Files from Cloud Storage', 'drivevault-for-easy-digital-downloads' ),
				'selectFromDrive'   => __( 'Add Google Drive File', 'drivevault-for-easy-digital-downloads' ),
				'googleDrive'       => __( 'Google Drive', 'drivevault-for-easy-digital-downloads' ),
				'searchPlaceholder' => __( 'Search files in Google Drive...', 'drivevault-for-easy-digital-downloads' ),
				'insertFiles'       => __( 'Insert Selected Files', 'drivevault-for-easy-digital-downloads' ),
				'cancel'            => __( 'Cancel', 'drivevault-for-easy-digital-downloads' ),
				'noFiles'           => __( 'No files found in this folder.', 'drivevault-for-easy-digital-downloads' ),
				'connecting'        => __( 'Connecting...', 'drivevault-for-easy-digital-downloads' ),
				'connected'         => __( 'Connected', 'drivevault-for-easy-digital-downloads' ),
				'disconnected'      => __( 'Disconnected', 'drivevault-for-easy-digital-downloads' ),
			),
		);

		// Always enqueue wp-components CSS for Gutenberg/WPDS components.
		wp_enqueue_style( 'wp-components' );

		// 1. Settings Page App
		if ( $is_settings_page ) {
			$current_user                  = wp_get_current_user();
			$localized_data['currentUser'] = array(
				'displayName' => $current_user->display_name,
				'userEmail'   => $current_user->user_email,
				'avatarUrl'   => get_avatar_url( $current_user->ID, array( 'size' => 96 ) ),
			);
			$localized_data['environment'] = array(
				'phpVersion'       => PHP_VERSION,
				'curlVersion'      => function_exists( 'curl_version' ) ? ( isset( curl_version()['version'] ) ? curl_version()['version'] : 'Supported' ) : false,
				'openssl'          => extension_loaded( 'openssl' ),
				'memoryLimit'      => ini_get( 'memory_limit' ) ? ini_get( 'memory_limit' ) : 'N/A',
				'maxExecutionTime' => ini_get( 'max_execution_time' ) ? ini_get( 'max_execution_time' ) . 's' : 'N/A',
				'eddVersion'       => defined( 'EDD_VERSION' ) ? EDD_VERSION : false,
			);

			$settings_controller        = new \DriveVaultEDD\API\Controllers\SettingsController( $oauth );
			$current_settings           = get_option( defined( 'DRIVEVAULT_EDD_OPTION_SETTINGS' ) ? DRIVEVAULT_EDD_OPTION_SETTINGS : 'drivevault_edd_settings', array() );
			$localized_data['settings'] = $settings_controller->format_settings_response( $current_settings );

			$asset_file = DRIVEVAULT_EDD_PATH . 'assets/build/index.asset.php';
			$asset_info = file_exists( $asset_file ) ? require $asset_file : array(
				'dependencies' => array( 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-data', 'wp-i18n' ),
				'version'      => DRIVEVAULT_EDD_VERSION,
			);

			wp_enqueue_script(
				'drivevault-edd-admin-settings',
				DRIVEVAULT_EDD_ASSETS_URL . 'build/index.js',
				$asset_info['dependencies'],
				$asset_info['version'],
				true
			);

			wp_localize_script( 'drivevault-edd-admin-settings', 'drivevaultData', $localized_data );
			wp_set_script_translations( 'drivevault-edd-admin-settings', 'drivevault-for-easy-digital-downloads', DRIVEVAULT_EDD_PATH . 'languages' );

			if ( file_exists( DRIVEVAULT_EDD_PATH . 'assets/build/index.css' ) ) {
				wp_enqueue_style(
					'drivevault-edd-admin-settings',
					DRIVEVAULT_EDD_ASSETS_URL . 'build/index.css',
					array( 'wp-components' ),
					$asset_info['version']
				);

				$suppress_css = '#edd-header, .edd-header, #edd-header-wrapper, .edd-footer-promotion, .edd-footer-promotion-links, #footer-upgrade, #footer-thankyou, #edd-flyout, .edd-flyout-container, .edd-flyout-trigger, .edd-flyout-menu { display: none !important; } body.download_page_drivevault-edd-settings #wpcontent, body:has(.drivevault-admin-wrap) #wpcontent { padding-left: 0 !important; } body.download_page_drivevault-edd-settings #wpbody, body:has(.drivevault-admin-wrap) #wpbody { padding-top: 0 !important; } body.download_page_drivevault-edd-settings #wpbody-content, body:has(.drivevault-admin-wrap) #wpbody-content { padding: 0 !important; } body.download_page_drivevault-edd-settings .wrap.drivevault-admin-wrap, .wrap.drivevault-admin-wrap { margin: 0 !important; padding: 0 !important; max-width: none !important; }';
				wp_add_inline_style( 'drivevault-edd-admin-settings', $suppress_css );
			}
		}

		// 2. Download Edit Page Picker
		if ( $is_download_page ) {
			$picker_asset_file = DRIVEVAULT_EDD_PATH . 'assets/build/product-picker.asset.php';
			$picker_asset_info = file_exists( $picker_asset_file ) ? require $picker_asset_file : array(
				'dependencies' => array( 'wp-element', 'wp-components', 'wp-api-fetch', 'wp-data', 'wp-i18n', 'jquery' ),
				'version'      => DRIVEVAULT_EDD_VERSION,
			);

			wp_enqueue_script(
				'drivevault-edd-download-picker',
				DRIVEVAULT_EDD_ASSETS_URL . 'build/product-picker.js',
				$picker_asset_info['dependencies'],
				$picker_asset_info['version'],
				true
			);

			wp_localize_script( 'drivevault-edd-download-picker', 'drivevaultData', $localized_data );
			wp_set_script_translations( 'drivevault-edd-download-picker', 'drivevault-for-easy-digital-downloads', DRIVEVAULT_EDD_PATH . 'languages' );

			if ( file_exists( DRIVEVAULT_EDD_PATH . 'assets/build/product-picker.css' ) ) {
				wp_enqueue_style(
					'drivevault-edd-download-picker',
					DRIVEVAULT_EDD_ASSETS_URL . 'build/product-picker.css',
					array( 'wp-components' ),
					$picker_asset_info['version']
				);
			}
		}
	}
}
