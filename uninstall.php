<?php
/**
 * Uninstall Handler for DriveVault for Easy Digital Downloads.
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Clean up plugin data for the current site.
 */
function drivevault_edd_uninstall_cleanup() {
	global $wpdb;

	// Clean up transients for this site.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	$wpdb->query(
		$wpdb->prepare(
			"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
			$wpdb->esc_like( '_transient_dvedd_' ) . '%',
			$wpdb->esc_like( '_transient_timeout_dvedd_' ) . '%'
		)
	);

	// Only clean options if explicitly configured
	$settings = get_option( 'drivevault_edd_settings', array() );
	if ( ! empty( $settings['delete_data_on_uninstall'] ) ) {
		delete_option( 'drivevault_edd_settings' );
		delete_option( 'drivevault_edd_google_tokens' );
		delete_option( 'drivevault_edd_cache_version' );
	}
}

if ( is_multisite() ) {
	$drivevault_site_ids = get_sites( array( 'fields' => 'ids' ) );
	foreach ( $drivevault_site_ids as $drivevault_site_id ) {
		switch_to_blog( $drivevault_site_id );
		drivevault_edd_uninstall_cleanup();
		restore_current_blog();
	}
} else {
	drivevault_edd_uninstall_cleanup();
}
