<?php
namespace DriveVaultEDD;

defined( 'ABSPATH' ) || exit;

/**
 * Main Singleton Plugin Class for Easy Digital Downloads.
 */
class Plugin {

	/**
	 * Singleton instance.
	 *
	 * @var Plugin|null
	 */
	private static $instance = null;

	/**
	 * Services.
	 */
	public $oauth;
	public $drive;
	public $download_handler;
	public $admin_menu;
	public $assets;
	public $download_metabox;
	public $rest_server;

	/**
	 * Get singleton instance.
	 *
	 * @return Plugin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->init_services();
		$this->init_hooks();
	}

	/**
	 * Instantiate all core services.
	 */
	private function init_services() {
		$this->oauth            = new Services\OAuthManager();
		$this->drive            = new Services\GoogleDriveClient( $this->oauth );
		$this->download_handler = new Services\EddDownloadHandler( $this->drive );
		$this->admin_menu       = new Admin\AdminMenu();
		$this->assets           = new Admin\Assets();
		$this->download_metabox = new Admin\DownloadMetabox();
		$this->rest_server      = new API\RestServer( $this->oauth, $this->drive );
	}

	/**
	 * Initialize hooks.
	 */
	private function init_hooks() {
		// Filter file saving in EDD download metabox to normalize cloud storage URLs.
		add_filter( 'edd_metabox_save_edd_download_files', array( $this, 'normalize_edd_download_files' ), 5, 2 );
	}

	/**
	 * Normalize custom cloud scheme URLs when EDD download files are saved.
	 *
	 * @param array $files   Array of file entries.
	 * @param int   $post_id Post ID.
	 * @return array Normalized files array.
	 */
	public function normalize_edd_download_files( $files, $post_id ) {
		if ( ! is_array( $files ) ) {
			return $files;
		}

		foreach ( $files as $key => $file_data ) {
			if ( ! empty( $file_data['file'] ) ) {
				$files[ $key ]['file'] = self::normalize_cloud_file_url( sanitize_text_field( $file_data['file'] ) );
			}
		}

		return $files;
	}

	/**
	 * Canonicalize cloud file URLs.
	 *
	 * @param string $url Raw URL string.
	 * @return string Normalized URL string.
	 */
	public static function normalize_cloud_file_url( $url ) {
		$url = trim( (string) $url );
		if ( empty( $url ) ) {
			return $url;
		}

		// Normalize googledrive:// to gdrive://
		if ( strpos( $url, 'googledrive://' ) === 0 ) {
			$url = 'gdrive://' . substr( $url, 14 );
		}

		// Ensure proper scheme format: scheme://file/{id}
		$schemes = array( 'gdrive', 'dropbox', 'onedrive', 's3' );
		foreach ( $schemes as $scheme ) {
			if ( strpos( $url, $scheme . '://' ) === 0 && strpos( $url, $scheme . '://file/' ) !== 0 ) {
				$identifier = substr( $url, strlen( $scheme . '://' ) );
				$url        = $scheme . '://file/' . ltrim( $identifier, '/' );
				break;
			}
		}

		return $url;
	}

	/**
	 * List of all supported cloud storage URI schemes.
	 *
	 * @return array
	 */
	public static function get_supported_schemes() {
		$schemes = apply_filters(
			'drivevault_edd_cloud_schemes',
			array( 'gdrive://', 'googledrive://' )
		);

		return apply_filters( 'drivevault_cloud_schemes', $schemes );
	}
}
