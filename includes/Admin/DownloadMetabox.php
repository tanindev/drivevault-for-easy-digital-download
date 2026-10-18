<?php
namespace DriveVaultEDD\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Easy Digital Downloads Download Editor Metabox & File Integration.
 */
class DownloadMetabox {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'admin_footer', array( $this, 'render_modal_portal_root' ) );
	}

	/**
	 * Render modal root element in admin footer for EDD download edit screen.
	 */
	public function render_modal_portal_root() {
		$screen = get_current_screen();
		if ( ! $screen || 'download' !== $screen->post_type ) {
			return;
		}
		?>
		<div id="drivevault-edd-picker-modal-root"></div>
		<?php
	}
}
