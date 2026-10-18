<?php
namespace DriveVaultEDD\Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Cache Helper for Google Drive responses using Transients.
 */
class Cache {

	const PREFIX         = 'dvedd_';
	const VERSION_OPTION = 'drivevault_edd_cache_version';

	/**
	 * In-memory memoized cache version.
	 *
	 * @var int|null
	 */
	protected static $cached_version = null;

	/**
	 * Get the current cache version salt.
	 *
	 * @return int
	 */
	public static function get_version() {
		if ( null === self::$cached_version ) {
			self::$cached_version = (int) get_option( self::VERSION_OPTION, 1 );
		}
		return self::$cached_version;
	}

	/**
	 * Build a versioned transient key.
	 *
	 * @param string $key Raw cache key.
	 * @return string
	 */
	protected static function get_cache_key( $key ) {
		$version = self::get_version();
		return self::PREFIX . $version . '_' . md5( $key );
	}

	/**
	 * Get cached data.
	 *
	 * @param string $key Cache key.
	 * @return mixed|false
	 */
	public static function get( $key ) {
		return get_transient( self::get_cache_key( $key ) );
	}

	/**
	 * Set cached data.
	 *
	 * @param string $key        Cache key.
	 * @param mixed  $data       Data to cache.
	 * @param int    $expiration Expiration in seconds (defaults to plugin setting or 600s).
	 * @return bool
	 */
	public static function set( $key, $data, $expiration = null ) {
		if ( null === $expiration ) {
			$settings   = get_option( defined( 'DRIVEVAULT_EDD_OPTION_SETTINGS' ) ? DRIVEVAULT_EDD_OPTION_SETTINGS : 'drivevault_edd_settings', array() );
			$expiration = ! empty( $settings['cache_ttl'] ) ? absint( $settings['cache_ttl'] ) : 600;
		}

		if ( $expiration <= 0 ) {
			return false;
		}

		return set_transient( self::get_cache_key( $key ), $data, $expiration );
	}

	/**
	 * Delete a specific cached item.
	 *
	 * @param string $key Cache key.
	 * @return bool
	 */
	public static function delete( $key ) {
		return delete_transient( self::get_cache_key( $key ) );
	}

	/**
	 * Flush all plugin transients.
	 *
	 * Bumps version salt for external object caches and clears database transients.
	 */
	public static function flush_all() {
		self::$cached_version = time();
		// Increment version salt to immediately invalidate external object caches (Redis/Memcached).
		update_option( self::VERSION_OPTION, self::$cached_version, false );

		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s",
				$wpdb->esc_like( '_transient_' . self::PREFIX ) . '%',
				$wpdb->esc_like( '_transient_timeout_' . self::PREFIX ) . '%'
			)
		);
	}
}
