import { useState, useEffect, useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Custom hook to aggregate live status, credentials, and storage quota
 * for the Google Drive storage engine.
 */
export const useCloudProvidersStatus = () => {
	const googleConnection = useSelect(
		( select ) => select( 'drivevault/drive' ).getConnectionStatus(),
		[]
	);
	const googleQuota = useSelect(
		( select ) => select( 'drivevault/drive' ).getQuota(),
		[]
	);
	const { fetchStatus: fetchGoogleStatus, fetchQuota: fetchGoogleQuota } =
		useDispatch( 'drivevault/drive' );

	const [ isLoading, setIsLoading ] = useState( false );

	const refresh = useCallback( async () => {
		setIsLoading( true );
		try {
			if ( fetchGoogleStatus ) {
				fetchGoogleStatus();
			}
			if ( fetchGoogleQuota ) {
				fetchGoogleQuota();
			}
		} catch ( e ) {
			// Ignore
		} finally {
			setIsLoading( false );
		}
	}, [ fetchGoogleStatus, fetchGoogleQuota ] );

	useEffect( () => {
		refresh();
	}, [ refresh ] );

	const isGoogleConnected =
		!! googleConnection?.is_connected ||
		!! window.drivevaultData?.isConnected;

	const connectedCount = isGoogleConnected ? 1 : 0;

	return {
		isLoading,
		refresh,
		connectedCount,
		currentUser: window.drivevaultData?.currentUser || {
			displayName: 'Administrator',
			userEmail: '',
			avatarUrl: '',
		},
		providers: {
			google: {
				id: 'google',
				name: 'Google Drive',
				isInstalled: true,
				isActive: true,
				isConnected: isGoogleConnected,
				email: googleConnection?.account_email || '',
				quota: googleQuota,
			},
		},
	};
};

export default useCloudProvidersStatus;
