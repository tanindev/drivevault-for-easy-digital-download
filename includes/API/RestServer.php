<?php
namespace DriveVaultEDD\API;

use DriveVaultEDD\Services\OAuthManager;
use DriveVaultEDD\Services\GoogleDriveClient;

defined( 'ABSPATH' ) || exit;

/**
 * REST Server Controller for Easy Digital Downloads.
 */
class RestServer {

	const PRIMARY_NAMESPACE = 'drivevault-edd/v1';
	const COMPAT_NAMESPACE  = 'drivevault/v1';

	/**
	 * Services.
	 */
	protected $oauth;
	protected $drive;

	/**
	 * Constructor.
	 *
	 * @param OAuthManager      $oauth
	 * @param GoogleDriveClient $drive
	 */
	public function __construct( OAuthManager $oauth, GoogleDriveClient $drive ) {
		$this->oauth = $oauth;
		$this->drive = $drive;
		$this->init_hooks();
	}

	/**
	 * Register REST hooks.
	 */
	private function init_hooks() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register all REST API routes.
	 */
	public function register_routes() {
		$auth_controller     = new Controllers\AuthController( $this->oauth );
		$drive_controller    = new Controllers\DriveController( $this->drive, $this->oauth );
		$settings_controller = new Controllers\SettingsController( $this->oauth );

		// Always register routes under EDD primary namespace
		$auth_controller->register_routes( self::PRIMARY_NAMESPACE );
		$drive_controller->register_routes( self::PRIMARY_NAMESPACE );
		$settings_controller->register_routes( self::PRIMARY_NAMESPACE );

		// Only register under compat namespace if WooCommerce plugin is not active
		if ( ! defined( 'DRIVEVAULT_VERSION' ) ) {
			$auth_controller->register_routes( self::COMPAT_NAMESPACE );
			$drive_controller->register_routes( self::COMPAT_NAMESPACE );
			$settings_controller->register_routes( self::COMPAT_NAMESPACE );
		}
	}
}
