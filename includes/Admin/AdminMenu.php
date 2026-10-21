<?php
namespace DriveVaultEDD\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Admin Menu Page Registration for Easy Digital Downloads.
 */
class AdminMenu {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'register_menu' ), 50 );
		add_filter( 'plugin_action_links_' . plugin_basename( DRIVEVAULT_EDD_FILE ), array( $this, 'add_action_links' ) );

		// Suppress EDD admin header, footer promo links, version text, and flyout menu on DriveVault settings page.
		add_filter( 'edd_is_admin_page', array( $this, 'filter_edd_is_admin_page' ), 10, 2 );
		add_filter( 'edd_admin_page_footer_exclusions', array( $this, 'filter_edd_footer_exclusions' ) );
	}

	/**
	 * Filter EDD admin page check to exclude DriveVault settings page from EDD global headers/promos.
	 *
	 * @param bool   $is_admin Whether the current screen is an EDD admin page.
	 * @param string $page     Page slug.
	 * @return bool
	 */
	public function filter_edd_is_admin_page( $is_admin, $page = '' ) {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$current_page = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : '';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		if ( DRIVEVAULT_EDD_PAGE_SLUG === $current_page || 'drivevault-settings' === $current_page ) {
			return false;
		}

		return $is_admin;
	}

	/**
	 * Exclude footer promos, reviews, version, and flyout from DriveVault settings page.
	 *
	 * @param array $exclusions Existing page exclusions.
	 * @return array
	 */
	public function filter_edd_footer_exclusions( $exclusions ) {
		if ( ! is_array( $exclusions ) ) {
			$exclusions = array();
		}

		$exclusions['download_page_' . DRIVEVAULT_EDD_PAGE_SLUG] = array(
			'flyout',
			'version',
			'review',
			'links',
		);

		return $exclusions;
	}

	/**
	 * Add Settings action link on the plugins list page.
	 *
	 * @param array $links Current plugin action links.
	 * @return array
	 */
	public function add_action_links( $links ) {
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'edit.php?post_type=download&page=' . DRIVEVAULT_EDD_PAGE_SLUG ) ),
			esc_html__( 'Settings', 'drivevault-for-easy-digital-downloads' )
		);
		array_unshift( $links, $settings_link );
		return $links;
	}

	/**
	 * Register EDD submenu page for DriveVault.
	 */
	public function register_menu() {
		$capability = current_user_can( 'manage_shop_settings' ) ? 'manage_shop_settings' : 'manage_options';

		add_submenu_page(
			'edit.php?post_type=download',
			__( 'DriveVault', 'drivevault-for-easy-digital-downloads' ),
			__( 'DriveVault', 'drivevault-for-easy-digital-downloads' ),
			$capability,
			DRIVEVAULT_EDD_PAGE_SLUG,
			array( $this, 'render_page' )
		);
	}

	/**
	 * Render React root container.
	 */
	public function render_page() {
		if ( ! current_user_can( 'manage_shop_settings' ) && ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap drivevault-admin-wrap">
			<hr class="wp-header-end" style="display:none !important; margin:0; border:0;">
			<div id="drivevault-notices-staging" style="display:none;"></div>
			<div id="drivevault-admin-root">
				<div class="drivevault-loading-placeholder" style="padding: 40px; text-align: center;">
					<p style="font-size: 16px; color: #64748b;"><?php esc_html_e( 'Loading DriveVault for Easy Digital Downloads...', 'drivevault-for-easy-digital-downloads' ); ?></p>
				</div>
			</div>
		</div>
		<?php
	}
}
