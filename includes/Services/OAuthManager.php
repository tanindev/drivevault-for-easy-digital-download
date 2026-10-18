<?php
namespace DriveVaultEDD\Services;

use DriveVaultEDD\Helpers\Cache;

defined( 'ABSPATH' ) || exit;

/**
 * Google OAuth 2.0 Token & Authentication Manager for Easy Digital Downloads.
 */
class OAuthManager {

	const GOOGLE_AUTH_URL   = 'https://accounts.google.com/o/oauth2/v2/auth';
	const GOOGLE_TOKEN_URL  = 'https://oauth2.googleapis.com/token';
	const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
	const GOOGLE_USERINFO   = 'https://www.googleapis.com/oauth2/v2/userinfo';

	const SCOPES = array(
		'https://www.googleapis.com/auth/drive.readonly',
		'https://www.googleapis.com/auth/userinfo.email',
		'https://www.googleapis.com/auth/userinfo.profile',
	);

	/**
	 * In-memory memoized tokens cache.
	 *
	 * @var array|false|null
	 */
	protected $cached_tokens = null;

	/**
	 * Get the OAuth Redirect URI.
	 *
	 * @return string
	 */
	public function get_redirect_uri() {
		return apply_filters(
			'drivevault_edd_redirect_uri',
			admin_url( 'edit.php?post_type=download&page=drivevault-edd-settings' )
		);
	}

	/**
	 * Get stored Google Cloud App credentials.
	 *
	 * @return array
	 */
	public function get_credentials() {
		$settings = get_option( DRIVEVAULT_EDD_OPTION_SETTINGS, array() );
		return array(
			'client_id'     => ! empty( $settings['client_id'] ) ? trim( $settings['client_id'] ) : '',
			'client_secret' => ! empty( $settings['client_secret'] ) ? trim( $settings['client_secret'] ) : '',
		);
	}

	/**
	 * Encrypt payload using AES-256-CBC and WordPress auth salt.
	 *
	 * @param mixed $data
	 * @return string|mixed
	 */
	public static function encrypt_payload( $data ) {
		if ( ! extension_loaded( 'openssl' ) || ! defined( 'AUTH_KEY' ) ) {
			return $data;
		}

		$json = wp_json_encode( $data );
		if ( false === $json ) {
			return $data;
		}

		$salt = defined( 'SECURE_AUTH_KEY' ) ? SECURE_AUTH_KEY : ( defined( 'AUTH_SALT' ) ? AUTH_SALT : 'dv_salt' );
		$key  = hash( 'sha256', AUTH_KEY . $salt, true );
		$iv   = function_exists( 'random_bytes' ) ? random_bytes( 16 ) : openssl_random_pseudo_bytes( 16 );

		$ciphertext = openssl_encrypt( $json, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv );
		if ( false === $ciphertext ) {
			return $data;
		}

		return 'dv_enc:' . base64_encode( $iv . $ciphertext );
	}

	/**
	 * Decrypt payload.
	 *
	 * @param mixed $payload
	 * @return mixed
	 */
	public static function decrypt_payload( $payload ) {
		if ( ! is_string( $payload ) || strpos( $payload, 'dv_enc:' ) !== 0 ) {
			return $payload; // Plaintext array or non-encrypted string
		}

		if ( ! extension_loaded( 'openssl' ) || ! defined( 'AUTH_KEY' ) ) {
			return false;
		}

		$raw = base64_decode( substr( $payload, 7 ), true );
		if ( false === $raw || strlen( $raw ) < 17 ) {
			return false;
		}

		$iv         = substr( $raw, 0, 16 );
		$ciphertext = substr( $raw, 16 );
		$salt       = defined( 'SECURE_AUTH_KEY' ) ? SECURE_AUTH_KEY : ( defined( 'AUTH_SALT' ) ? AUTH_SALT : 'dv_salt' );
		$key        = hash( 'sha256', AUTH_KEY . $salt, true );

		$decrypted = openssl_decrypt( $ciphertext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv );
		if ( false === $decrypted ) {
			return false;
		}

		$data = json_decode( $decrypted, true );
		return is_array( $data ) ? $data : false;
	}

	/**
	 * Save tokens to database with encryption.
	 *
	 * @param array $tokens
	 * @return bool
	 */
	public function save_tokens( array $tokens ) {
		$payload             = self::encrypt_payload( $tokens );
		$updated             = update_option( DRIVEVAULT_EDD_OPTION_TOKENS, $payload, false );
		$this->cached_tokens = $tokens;
		return $updated;
	}

	/**
	 * Get stored tokens with automatic transparent decryption.
	 *
	 * @return array|false
	 */
	public function get_tokens() {
		if ( null === $this->cached_tokens ) {
			$raw                 = get_option( DRIVEVAULT_EDD_OPTION_TOKENS, false );
			$this->cached_tokens = self::decrypt_payload( $raw );
		}
		return $this->cached_tokens;
	}

	/**
	 * Check if Google Drive is currently connected.
	 *
	 * @return bool
	 */
	public function is_connected() {
		$tokens = $this->get_tokens();
		return ! empty( $tokens['access_token'] ) || ! empty( $tokens['refresh_token'] );
	}

	/**
	 * Generate OAuth 2.0 Authorization URL.
	 *
	 * @return string|\WP_Error
	 */
	public function get_auth_url() {
		$creds = $this->get_credentials();
		if ( empty( $creds['client_id'] ) || empty( $creds['client_secret'] ) ) {
			return new \WP_Error( 'missing_credentials', __( 'Google Client ID and Client Secret are required.', 'drivevault-for-easy-digital-downloads' ) );
		}

		$state = wp_create_nonce( 'drivevault_oauth_state' );

		$params = array(
			'client_id'              => $creds['client_id'],
			'redirect_uri'           => $this->get_redirect_uri(),
			'response_type'          => 'code',
			'scope'                  => implode( ' ', self::SCOPES ),
			'access_type'            => 'offline',
			'prompt'                 => 'consent',
			'include_granted_scopes' => 'true',
			'state'                  => $state,
		);

		return self::GOOGLE_AUTH_URL . '?' . http_build_query( $params, '', '&', PHP_QUERY_RFC3986 );
	}

	/**
	 * Exchange Authorization Code for Access & Refresh Tokens.
	 *
	 * @param string $code  Authorization code from Google.
	 * @param string $state OAuth state nonce.
	 * @return array|\WP_Error
	 */
	public function handle_auth_code( $code, $state = '' ) {
		if ( empty( $state ) || ! wp_verify_nonce( $state, 'drivevault_oauth_state' ) ) {
			return new \WP_Error( 'invalid_state', __( 'Invalid or missing authorization state. Please try reconnecting again.', 'drivevault-for-easy-digital-downloads' ) );
		}

		$creds = $this->get_credentials();
		if ( empty( $creds['client_id'] ) || empty( $creds['client_secret'] ) ) {
			return new \WP_Error( 'missing_credentials', __( 'Missing Google Client ID or Secret.', 'drivevault-for-easy-digital-downloads' ) );
		}

		$body = array(
			'code'          => $code,
			'client_id'     => $creds['client_id'],
			'client_secret' => $creds['client_secret'],
			'redirect_uri'  => $this->get_redirect_uri(),
			'grant_type'    => 'authorization_code',
		);

		$response = wp_remote_post( self::GOOGLE_TOKEN_URL, array(
			'body'    => $body,
			'timeout' => 30,
		) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $data['access_token'] ) ) {
			$error_desc = ! empty( $data['error_description'] ) ? $data['error_description'] : __( 'Failed to exchange authorization code.', 'drivevault-for-easy-digital-downloads' );
			return new \WP_Error( 'token_exchange_failed', $error_desc );
		}

		$tokens = array(
			'access_token'  => $data['access_token'],
			'refresh_token' => ! empty( $data['refresh_token'] ) ? $data['refresh_token'] : '',
			'expires_at'    => time() + ( isset( $data['expires_in'] ) ? (int) $data['expires_in'] : 3600 ),
			'created_at'    => time(),
			'scope'         => ! empty( $data['scope'] ) ? $data['scope'] : '',
		);

		// If refresh_token wasn't returned, retain previous refresh_token if present.
		$existing_tokens = $this->get_tokens();
		if ( empty( $tokens['refresh_token'] ) && ! empty( $existing_tokens['refresh_token'] ) ) {
			$tokens['refresh_token'] = $existing_tokens['refresh_token'];
		}

		// Fetch user profile information.
		$user_info = $this->fetch_user_profile( $tokens['access_token'] );
		if ( ! is_wp_error( $user_info ) ) {
			$tokens['account_email']   = ! empty( $user_info['email'] ) ? $user_info['email'] : '';
			$tokens['account_name']    = ! empty( $user_info['name'] ) ? $user_info['name'] : '';
			$tokens['account_picture'] = ! empty( $user_info['picture'] ) ? $user_info['picture'] : '';
		}

		$this->save_tokens( $tokens );
		Cache::flush_all();

		return $tokens;
	}

	/**
	 * Fetch basic Google User Profile (email, name, picture).
	 *
	 * @param string $access_token
	 * @return array|\WP_Error
	 */
	public function fetch_user_profile( $access_token ) {
		$response = wp_remote_get( self::GOOGLE_USERINFO, array(
			'headers' => array(
				'Authorization' => 'Bearer ' . $access_token,
			),
			'timeout' => 15,
		) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$body = wp_remote_retrieve_body( $response );
		return json_decode( $body, true );
	}

	/**
	 * Get a valid Access Token, automatically refreshing if expired.
	 *
	 * @return string|\WP_Error
	 */
	public function get_access_token() {
		$tokens = $this->get_tokens();
		if ( empty( $tokens ) || empty( $tokens['access_token'] ) ) {
			return new \WP_Error( 'not_connected', __( 'Google Drive account is not connected.', 'drivevault-for-easy-digital-downloads' ) );
		}

		// Buffer by 60 seconds.
		if ( ! empty( $tokens['expires_at'] ) && $tokens['expires_at'] > ( time() + 60 ) ) {
			return $tokens['access_token'];
		}

		// Token is expired, try to refresh.
		if ( empty( $tokens['refresh_token'] ) ) {
			return new \WP_Error( 'refresh_token_missing', __( 'Refresh token is missing. Please reconnect your Google Drive account.', 'drivevault-for-easy-digital-downloads' ) );
		}

		return $this->refresh_access_token( $tokens['refresh_token'] );
	}

	/**
	 * Refresh access token using refresh_token.
	 *
	 * @param string $refresh_token
	 * @return string|\WP_Error
	 */
	public function refresh_access_token( $refresh_token ) {
		$creds = $this->get_credentials();
		if ( empty( $creds['client_id'] ) || empty( $creds['client_secret'] ) ) {
			return new \WP_Error( 'missing_credentials', __( 'Missing Google Client ID or Secret.', 'drivevault-for-easy-digital-downloads' ) );
		}

		$body = array(
			'client_id'     => $creds['client_id'],
			'client_secret' => $creds['client_secret'],
			'refresh_token' => $refresh_token,
			'grant_type'    => 'refresh_token',
		);

		$response = wp_remote_post( self::GOOGLE_TOKEN_URL, array(
			'body'    => $body,
			'timeout' => 30,
		) );

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( empty( $data['access_token'] ) ) {
			$error_desc = ! empty( $data['error_description'] ) ? $data['error_description'] : __( 'Failed to refresh Google Drive token.', 'drivevault-for-easy-digital-downloads' );
			return new \WP_Error( 'token_refresh_failed', $error_desc );
		}

		$tokens                 = $this->get_tokens();
		$tokens['access_token'] = $data['access_token'];
		$tokens['expires_at']   = time() + ( isset( $data['expires_in'] ) ? (int) $data['expires_in'] : 3600 );
		if ( ! empty( $data['refresh_token'] ) ) {
			$tokens['refresh_token'] = $data['refresh_token'];
		}

		$this->save_tokens( $tokens );

		return $tokens['access_token'];
	}

	/**
	 * Disconnect and revoke Google account.
	 *
	 * @return bool
	 */
	public function disconnect() {
		$tokens = $this->get_tokens();
		if ( ! empty( $tokens['access_token'] ) ) {
			wp_remote_post( self::GOOGLE_REVOKE_URL, array(
				'body'    => array( 'token' => $tokens['access_token'] ),
				'timeout' => 15,
			) );
		}

		delete_option( DRIVEVAULT_EDD_OPTION_TOKENS );
		$this->cached_tokens = false;
		Cache::flush_all();

		return true;
	}

	/**
	 * Get current connection status details.
	 *
	 * @return array
	 */
	public function get_status() {
		$tokens    = $this->get_tokens();
		$connected = $this->is_connected();
		$creds     = $this->get_credentials();

		return array(
			'is_connected'    => $connected,
			'has_credentials' => ! empty( $creds['client_id'] ) && ! empty( $creds['client_secret'] ),
			'client_id'       => $creds['client_id'],
			'redirect_uri'    => $this->get_redirect_uri(),
			'account_email'   => $connected && ! empty( $tokens['account_email'] ) ? $tokens['account_email'] : '',
			'account_name'    => $connected && ! empty( $tokens['account_name'] ) ? $tokens['account_name'] : '',
			'account_picture' => $connected && ! empty( $tokens['account_picture'] ) ? $tokens['account_picture'] : '',
			'expires_at'      => $connected && ! empty( $tokens['expires_at'] ) ? $tokens['expires_at'] : 0,
		);
	}
}
