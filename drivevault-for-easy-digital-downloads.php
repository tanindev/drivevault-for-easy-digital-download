<?php
/**
 * Plugin Name:       DriveVault for Easy Digital Downloads
 * Plugin URI:        https://github.com/tanindev/drivevault-for-easy-digital-downloads
 * Description:       Seamlessly attach and serve Easy Digital Downloads digital files directly from Google Drive.
 * Version:           1.0.0
 * Author:            Tanin's Dev
 * Author URI:        https://profiles.wordpress.org/tanindev/
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       drivevault-for-easy-digital-downloads
 * Domain Path:       /languages
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Requires Plugins:  easy-digital-downloads
 */

defined( 'ABSPATH' ) || exit;

define( 'DRIVEVAULT_EDD_VERSION', '1.0.0' );
define( 'DRIVEVAULT_EDD_FILE', __FILE__ );
define( 'DRIVEVAULT_EDD_PATH', plugin_dir_path( __FILE__ ) );
define( 'DRIVEVAULT_EDD_URL', plugin_dir_url( __FILE__ ) );
define( 'DRIVEVAULT_EDD_ASSETS_URL', DRIVEVAULT_EDD_URL . 'assets/' );

define( 'DRIVEVAULT_EDD_PAGE_SLUG', 'drivevault-edd-settings' );
define( 'DRIVEVAULT_EDD_OPTION_SETTINGS', 'drivevault_edd_settings' );
define( 'DRIVEVAULT_EDD_OPTION_TOKENS', 'drivevault_edd_google_tokens' );

/**
 * Autoloader for Plugin Classes.
 */
spl_autoload_register( function ( $class ) {
	$prefix   = 'DriveVaultEDD\\';
	$base_dir = DRIVEVAULT_EDD_PATH . 'includes/';

	$len = strlen( $prefix );
	if ( strncmp( $prefix, $class, $len ) !== 0 ) {
		return;
	}

	$relative_class = substr( $class, $len );
	$file           = $base_dir . str_replace( '\\', '/', $relative_class ) . '.php';

	if ( file_exists( $file ) ) {
		require_once $file;
	}
} );

/**
 * Check dependencies and initialize plugin.
 */
function drivevault_edd_init_plugin() {
	// Check if Easy Digital Downloads is installed and active.
	if ( ! class_exists( 'Easy_Digital_Downloads' ) ) {
		add_action( 'admin_notices', function () {
			?>
			<div class="notice notice-warning is-dismissible">
				<p>
					<strong><?php esc_html_e( 'DriveVault for Easy Digital Downloads', 'drivevault-for-easy-digital-downloads' ); ?></strong>
					<?php esc_html_e( 'requires Easy Digital Downloads to be installed and active.', 'drivevault-for-easy-digital-downloads' ); ?>
				</p>
			</div>
			<?php
		} );
		return;
	}

	// Initialize main plugin singleton.
	\DriveVaultEDD\Plugin::instance();
}
add_action( 'plugins_loaded', 'drivevault_edd_init_plugin' );

/**
 * Activation Hook.
 */
register_activation_hook( __FILE__, function () {
	$default_settings = array(
		'client_id'              => '',
		'client_secret'          => '',
		'download_method'        => 'redirect',
		'cache_ttl'              => 600,        // 10 minutes
		'chunk_size_mb'          => 8,          // 8MB stream chunks
		'enable_shared_drive'    => false,
		'log_retention_days'     => 60,
		'anonymize_download_ips' => false,
	);

	if ( false === get_option( DRIVEVAULT_EDD_OPTION_SETTINGS ) ) {
		update_option( DRIVEVAULT_EDD_OPTION_SETTINGS, $default_settings, false );
	}
} );

/**
 * Load template helper function.
 *
 * @param string $template_name Template file name.
 * @param array  $args          Data to extract into template.
 */
function drivevault_edd_get_template( $template_name, $args = array() ) {
	\DriveVaultEDD\Helpers\Template::load( $template_name, $args );
}
