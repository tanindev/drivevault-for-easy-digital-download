<?php
namespace DriveVaultEDD\API\Controllers;

use DriveVaultEDD\Services\OAuthManager;
use DriveVaultEDD\Helpers\Cache;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * REST API Settings Controller.
 */
class SettingsController {

	/**
	 * OAuth Manager.
	 *
	 * @var OAuthManager
	 */
	protected $oauth;

	/**
	 * Constructor.
	 *
	 * @param OAuthManager $oauth
	 */
	public function __construct( OAuthManager $oauth ) {
		$this->oauth = $oauth;
	}

	/**
	 * Register routes.
	 *
	 * @param string $namespace
	 */
	public function register_routes( $namespace = 'drivevault/v1' ) {
		register_rest_route( $namespace, '/settings', array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'check_admin_permissions' ),
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'check_admin_permissions' ),
				'args'                => array(
					'client_id'                  => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'client_secret'              => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'download_method'            => array(
						'type'              => 'string',
						'enum'              => array( 'stream', 'redirect' ),
						'sanitize_callback' => 'sanitize_text_field',
					),
					'cache_ttl'                  => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'chunk_size_mb'              => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'enable_shared_drive'        => array(
						'type'              => 'boolean',
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
					'delete_data_on_uninstall'   => array(
						'type'              => 'boolean',
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
					'error_message_disconnected' => array(
						'type'              => 'string',
						'sanitize_callback' => 'sanitize_text_field',
					),
					'log_retention_days'         => array(
						'type'              => 'integer',
						'sanitize_callback' => 'absint',
					),
					'anonymize_download_ips'     => array(
						'type'              => 'boolean',
						'sanitize_callback' => 'rest_sanitize_boolean',
					),
				),
			),
		) );
	}

	/**
	 * Admin permissions check.
	 */
	public function check_admin_permissions() {
		return current_user_can( 'manage_shop_settings' ) || current_user_can( 'manage_options' );
	}

	/**
	 * Get settings.
	 */
	public function get_settings( WP_REST_Request $request ) {
		$settings = get_option( defined( 'DRIVEVAULT_EDD_OPTION_SETTINGS' ) ? DRIVEVAULT_EDD_OPTION_SETTINGS : 'drivevault_edd_settings', array() );
		return new WP_REST_Response( $this->format_settings_response( $settings ), 200 );
	}

	/**
	 * Update settings.
	 */
	public function update_settings( WP_REST_Request $request ) {
		$current = get_option( defined( 'DRIVEVAULT_EDD_OPTION_SETTINGS' ) ? DRIVEVAULT_EDD_OPTION_SETTINGS : 'drivevault_edd_settings', array() );
		$params  = $request->get_params();

		$allowed_keys = array(
			'client_id',
			'client_secret',
			'download_method',
			'cache_ttl',
			'chunk_size_mb',
			'enable_shared_drive',
			'delete_data_on_uninstall',
			'error_message_disconnected',
			'log_retention_days',
			'anonymize_download_ips',
		);

		$allowed_methods = apply_filters(
			'drivevault_edd_allowed_download_methods',
			apply_filters( 'drivevault_allowed_download_methods', array( 'redirect' ) )
		);

		foreach ( $allowed_keys as $key ) {
			if ( array_key_exists( $key, $params ) ) {
				$val = $params[ $key ];
				if ( 'download_method' === $key ) {
					if ( ! in_array( $val, $allowed_methods, true ) ) {
						return new WP_Error(
							'invalid_download_method',
							__( 'Invalid download method.', 'drivevault-for-easy-digital-downloads' ),
							array( 'status' => 400 )
						);
					}
					$current[ $key ] = sanitize_text_field( $val );
				} elseif ( 'client_secret' === $key ) {
					if ( ! empty( $val ) && strpos( $val, '••••' ) === false ) {
						$current[ $key ] = trim( sanitize_text_field( $val ) );
					}
				} elseif ( 'client_id' === $key ) {
					$current[ $key ] = trim( sanitize_text_field( $val ) );
				} elseif ( in_array( $key, array( 'cache_ttl', 'chunk_size_mb', 'log_retention_days' ), true ) ) {
					$current[ $key ] = absint( $val );
				} elseif ( in_array( $key, array( 'enable_shared_drive', 'delete_data_on_uninstall', 'anonymize_download_ips' ), true ) ) {
					$current[ $key ] = (bool) $val;
				} else {
					$current[ $key ] = sanitize_text_field( $val );
				}
			}
		}

		update_option( defined( 'DRIVEVAULT_EDD_OPTION_SETTINGS' ) ? DRIVEVAULT_EDD_OPTION_SETTINGS : 'drivevault_edd_settings', $current, false );
		Cache::flush_all();

		return new WP_REST_Response( array(
			'success'  => true,
			'settings' => $this->format_settings_response( $current ),
			'message'  => __( 'Settings saved successfully.', 'drivevault-for-easy-digital-downloads' ),
		), 200 );
	}

	/**
	 * Format settings array for API response, masking secret keys.
	 *
	 * @param array $settings
	 * @return array
	 */
	public function format_settings_response( $settings ) {
		$defaults = array(
			'client_id'                  => '',
			'client_secret'              => '',
			'download_method'            => 'redirect',
			'cache_ttl'                  => 600,
			'chunk_size_mb'              => 8,
			'enable_shared_drive'        => false,
			'delete_data_on_uninstall'   => false,
			'error_message_disconnected' => '',
			'log_retention_days'         => 60,
			'anonymize_download_ips'     => false,
		);

		$settings = wp_parse_args( $settings, $defaults );

		// Mask client secret for safety
		if ( ! empty( $settings['client_secret'] ) ) {
			$len = strlen( $settings['client_secret'] );
			if ( $len > 8 ) {
				$settings['client_secret_masked'] = substr( $settings['client_secret'], 0, 4 ) . str_repeat( '•', $len - 8 ) . substr( $settings['client_secret'], -4 );
			} else {
				$settings['client_secret_masked'] = '••••••••';
			}
		} else {
			$settings['client_secret_masked'] = '';
		}

		$settings['allowed_download_methods'] = apply_filters(
			'drivevault_edd_allowed_download_methods',
			apply_filters( 'drivevault_allowed_download_methods', array( 'redirect' ) )
		);
		$settings['has_shared_drive_support'] = true;

		return $settings;
	}
}
