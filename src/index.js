import React, { useState, useEffect, useRef } from 'react';
import { render } from '@wordpress/element';
import { Button, Notice, Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

import store from './store';
import Tabs from './components/common/Tabs';
import ConnectionBadge from './components/common/ConnectionBadge';
import ConnectedAccountsDropdown from './components/common/ConnectedAccountsDropdown';
import useCloudProvidersStatus from './hooks/useCloudProvidersStatus';
import ApiSettings from './components/Settings/ApiSettings';
import DownloadSettings from './components/Settings/DownloadSettings';
import SystemStatus from './components/Settings/SystemStatus';
import Icon from './components/common/Icon';
import ToastContainer from './components/common/ToastContainer';
import AdminNoticesBell from './components/common/AdminNoticesBell';
import { MainAppSkeleton } from './components/common/Skeleton';

import './scss/icons.scss';
import './scss/admin.scss';

const VALID_TABS = [ 'api', 'downloads', 'status' ];
const VALID_PROVIDERS = [ 'google' ];

const getInitialTab = () => {
	if ( typeof window === 'undefined' ) {
		return 'api';
	}
	const urlParams = new URLSearchParams( window.location.search );
	const tab = urlParams.get( 'tab' );
	if ( tab && VALID_TABS.includes( tab ) ) {
		return tab;
	}
	const hash = window.location.hash.replace( '#', '' );
	if ( hash && VALID_TABS.includes( hash ) ) {
		return hash;
	}
	return 'api';
};

const getInitialProvider = () => {
	if ( typeof window === 'undefined' ) {
		return 'google';
	}
	const urlParams = new URLSearchParams( window.location.search );
	const provider = urlParams.get( 'provider' );
	if ( provider && VALID_PROVIDERS.includes( provider ) ) {
		return provider;
	}
	return 'google';
};

const AdminApp = () => {
	const [ activeTab, setActiveTab ] = useState( getInitialTab );
	const [ activeProvider, setActiveProvider ] =
		useState( getInitialProvider );
	const cloudStatus = useCloudProvidersStatus();
	const [ localSettings, setLocalSettings ] = useState(
		window.drivevaultData?.settings || null
	);
	const [ isProcessingAuth, setIsProcessingAuth ] = useState( false );

	const connectionStatus = useSelect(
		( select ) => select( 'drivevault/drive' ).getConnectionStatus(),
		[]
	);
	const settings = useSelect(
		( select ) => select( 'drivevault/drive' ).getSettings(),
		[]
	);
	const isLoading = useSelect(
		( select ) => select( 'drivevault/drive' ).isLoading(),
		[]
	);

	const {
		fetchSettings,
		saveSettings,
		fetchStatus,
		setConnectionStatus,
		createToast,
	} = useDispatch( 'drivevault/drive' );

	const childSaveHandlers = useRef( {} );

	const handleRegisterChildSave = ( key, fn ) => {
		if ( fn ) {
			childSaveHandlers.current[ key ] = fn;
		} else {
			delete childSaveHandlers.current[ key ];
		}
	};

	const handleTabChange = ( newTab ) => {
		if ( ! VALID_TABS.includes( newTab ) || newTab === activeTab ) {
			return;
		}
		setActiveTab( newTab );

		const url = new URL( window.location.href );
		url.searchParams.set( 'tab', newTab );
		window.history.pushState(
			{ tab: newTab, provider: activeProvider },
			'',
			url.toString()
		);
	};

	const handleProviderChange = ( newProvider ) => {
		if (
			! VALID_PROVIDERS.includes( newProvider ) ||
			newProvider === activeProvider
		) {
			return;
		}
		setActiveProvider( newProvider );

		const url = new URL( window.location.href );
		if ( newProvider === 'google' ) {
			url.searchParams.delete( 'provider' );
		} else {
			url.searchParams.set( 'provider', newProvider );
		}
		window.history.pushState(
			{ tab: activeTab, provider: newProvider },
			'',
			url.toString()
		);
	};

	const handleNavigate = ( targetTab, targetProvider = null ) => {
		if ( targetTab && VALID_TABS.includes( targetTab ) ) {
			setActiveTab( targetTab );
		}
		if ( targetProvider && VALID_PROVIDERS.includes( targetProvider ) ) {
			setActiveProvider( targetProvider );
		}

		const url = new URL( window.location.href );
		if ( targetTab ) {
			url.searchParams.set( 'tab', targetTab );
		}
		if ( targetProvider ) {
			if ( targetProvider === 'google' ) {
				url.searchParams.delete( 'provider' );
			} else {
				url.searchParams.set( 'provider', targetProvider );
			}
		}
		window.history.pushState(
			{
				tab: targetTab || activeTab,
				provider: targetProvider || activeProvider,
			},
			'',
			url.toString()
		);
	};

	// Synchronize with browser Back and Forward history buttons
	useEffect( () => {
		const onPopState = () => {
			const currentTab = getInitialTab();
			setActiveTab( currentTab );
			const currentProvider = getInitialProvider();
			setActiveProvider( currentProvider );
		};

		window.addEventListener( 'popstate', onPopState );
		return () => window.removeEventListener( 'popstate', onPopState );
	}, [] );

	// Check URL for OAuth callback codes and status flags
	useEffect( () => {
		fetchStatus();
		fetchSettings();

		const urlParams = new URLSearchParams( window.location.search );
		const code = urlParams.get( 'code' );
		const state = urlParams.get( 'state' );

		// Google OAuth callback
		if ( code ) {
			setIsProcessingAuth( true );
			apiFetch( {
				path: 'drivevault-edd/v1/auth/callback',
				method: 'POST',
				data: { code, state },
			} )
				.then( ( res ) => {
					createToast(
						res.message ||
							__(
								'Connected to Google Drive successfully!',
								'drivevault-for-easy-digital-downloads'
							),
						'success'
					);
					fetchStatus();
					// Clean up URL while preserving current tab
					const cleanUrl = new URL( window.location.href );
					cleanUrl.searchParams.delete( 'code' );
					cleanUrl.searchParams.delete( 'state' );
					cleanUrl.searchParams.delete( 'scope' );
					cleanUrl.searchParams.set(
						'page',
						window.drivevaultData?.pageSlug ||
							'drivevault-edd-settings'
					);
					cleanUrl.searchParams.set( 'tab', activeTab );
					window.history.replaceState(
						{ tab: activeTab, provider: activeProvider },
						document.title,
						cleanUrl.toString()
					);
				} )
				.catch( ( err ) => {
					createToast(
						err.message ||
							__(
								'Failed to complete Google authentication.',
								'drivevault-for-easy-digital-downloads'
							),
						'error'
					);
				} )
				.finally( () => {
					setIsProcessingAuth( false );
				} );
		}
	}, [] );

	useEffect( () => {
		if ( settings ) {
			setLocalSettings( settings );
		}
	}, [ settings ] );

	const handleFieldChange = ( key, value ) => {
		setLocalSettings( ( prev ) => ( {
			...prev,
			[ key ]: value,
		} ) );
	};

	const handleSave = async () => {
		if ( ! localSettings ) return;
		try {
			const res = await saveSettings( localSettings );
			createToast(
				res?.message ||
					__(
						'Settings saved successfully.',
						'drivevault-for-easy-digital-downloads'
					),
				'success'
			);
		} catch ( err ) {
			createToast(
				err?.message ||
					__(
						'Failed to save settings.',
						'drivevault-for-easy-digital-downloads'
					),
				'error'
			);
		}
	};

	const tabs = [
		{
			key: 'api',
			title: __(
				'API & Connection',
				'drivevault-for-easy-digital-downloads'
			),
			icon: <Icon name="key" size={ 17 } />,
		},
		{
			key: 'downloads',
			title: __(
				'Download Settings',
				'drivevault-for-easy-digital-downloads'
			),
			icon: <Icon name="cloud_download" size={ 17 } />,
		},
		{
			key: 'status',
			title: __(
				'Quota & Status',
				'drivevault-for-easy-digital-downloads'
			),
			icon: <Icon name="pie_chart" size={ 17 } />,
		},
	];

	if ( ! localSettings ) {
		return (
			<div className="drivevault-app">
				<MainAppSkeleton />
			</div>
		);
	}

	return (
		<div className="drivevault-app">
			<ToastContainer />
			{ /* Top Header Card */ }
			<header className="drivevault-header">
				<div className="drivevault-header-left">
					<div className="drivevault-logo-icon">
						<Icon name="cloud_queue" size={ 30 } color="#1a73e8" />
					</div>
					<div className="drivevault-header-titles">
						<h1>
							{ __(
								'Easy Digital Downloads Cloud Storage Integration',
								'drivevault-for-easy-digital-downloads'
							) }
						</h1>
						<p className="drivevault-subtitle">
							{ __(
								'Connect Google Drive to Easy Digital Downloads.',
								'drivevault-for-easy-digital-downloads'
							) }
						</p>
					</div>
				</div>
				<div className="drivevault-header-right">
					<AdminNoticesBell />
					<ConnectedAccountsDropdown
						statusData={ cloudStatus }
						onNavigate={ handleNavigate }
					/>
				</div>
			</header>

			{ /* Centered Content Container */ }
			<div className="drivevault-container">
				{ /* Main Settings Body */ }
				<div className="drivevault-body-card">
					{ /* Navigation Tabs Bar */ }
					<div className="drivevault-tabs-header-bar">
						<Tabs
							tabs={ tabs }
							active={ activeTab }
							onChange={ handleTabChange }
						/>
					</div>

					{ isProcessingAuth && (
						<div className="drivevault-loading-overlay">
							<Spinner />
							<p>
								{ __(
									'Authenticating with Google Cloud...',
									'drivevault-for-easy-digital-downloads'
								) }
							</p>
						</div>
					) }

					{ /* Tab Contents */ }
					<div className="drivevault-tab-content-wrapper">
						{ activeTab === 'api' && (
							<ApiSettings
								settings={ localSettings }
								onChange={ handleFieldChange }
								onSave={ handleSave }
								connectionStatus={ connectionStatus }
								onStatusChange={ fetchStatus }
							/>
						) }

						{ activeTab === 'downloads' && (
							<DownloadSettings
								settings={ localSettings }
								onChange={ handleFieldChange }
								onNavigateTab={ setActiveTab }
								onRegisterChildSave={ ( fn ) =>
									handleRegisterChildSave(
										'expiringLinks',
										fn
									)
								}
							/>
						) }

						{ activeTab === 'status' && (
							<SystemStatus
								onNavigate={ handleNavigate }
								cloudStatus={ cloudStatus }
							/>
						) }
					</div>

					{ /* Action Save Bar (Only shown on Google Drive & Download Settings) */ }
					{ ( activeTab === 'api' || activeTab === 'downloads' ) && (
						<div className="drivevault-save-bar">
							<button
								type="button"
								className="drivevault-btn drivevault-btn--primary"
								onClick={ handleSave }
								disabled={ isLoading || ! localSettings }
							>
								{ isLoading ? (
									<>
										<Spinner />
										<span>
											{ __(
												'Saving...',
												'drivevault-for-easy-digital-downloads'
											) }
										</span>
									</>
								) : (
									<>
										<Icon name="check" size={ 17 } />
										<span>
											{ __(
												'Save Settings',
												'drivevault-for-easy-digital-downloads'
											) }
										</span>
									</>
								) }
							</button>
						</div>
					) }
				</div>
			</div>
		</div>
	);
};

const root = document.getElementById( 'drivevault-admin-root' );
if ( root ) {
	render( <AdminApp />, root );
}
