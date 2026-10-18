import React, { useState, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import Icon from './Icon';

export const ConnectedAccountsDropdown = ( { statusData, onNavigate } ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ imgError, setImgError ] = useState( false );
	const dropdownRef = useRef( null );

	const { currentUser, connectedCount, providers } = statusData;

	// Close on click outside & Escape key
	useEffect( () => {
		const handleClickOutside = ( e ) => {
			if (
				dropdownRef.current &&
				! dropdownRef.current.contains( e.target )
			) {
				setIsOpen( false );
			}
		};

		const handleKeyDown = ( e ) => {
			if ( e.key === 'Escape' ) {
				setIsOpen( false );
			}
		};

		if ( isOpen ) {
			document.addEventListener( 'mousedown', handleClickOutside );
			document.addEventListener( 'keydown', handleKeyDown );
		}

		return () => {
			document.removeEventListener( 'mousedown', handleClickOutside );
			document.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [ isOpen ] );

	const userInitial = (
		currentUser?.displayName?.charAt( 0 ) ||
		currentUser?.userEmail?.charAt( 0 ) ||
		'A'
	).toUpperCase();

	const handleItemClick = ( tab, provider ) => {
		setIsOpen( false );
		if ( onNavigate ) {
			onNavigate( tab, provider );
		}
	};

	return (
		<div className="drivevault-account-menu-wrapper" ref={ dropdownRef }>
			{ /* Avatar / Connection Trigger Button */ }
			<button
				type="button"
				className={ `drivevault-account-trigger-btn ${
					isOpen ? 'is-active' : ''
				} ${
					connectedCount > 0 ? 'is-connected' : 'is-disconnected'
				}` }
				onClick={ () => setIsOpen( ! isOpen ) }
				aria-expanded={ isOpen }
				aria-haspopup="true"
				title={ __(
					'Cloud Storage Accounts Status',
					'drivevault-for-easy-digital-download'
				) }
			>
				<div className="drivevault-avatar-badge-wrap">
					{ currentUser?.avatarUrl && ! imgError ? (
						<img
							src={ currentUser.avatarUrl }
							alt={ currentUser.displayName || 'User' }
							className="drivevault-avatar-img"
							onError={ () => setImgError( true ) }
						/>
					) : (
						<div className="drivevault-avatar-fallback">
							{ userInitial }
						</div>
					) }
					<span
						className={ `drivevault-avatar-status-dot ${
							connectedCount > 0 ? 'is-online' : 'is-offline'
						}` }
					/>
				</div>

				<div className="drivevault-account-trigger-meta">
					<span className="drivevault-trigger-label">
						{ __(
							'Google Drive',
							'drivevault-for-easy-digital-download'
						) }
					</span>
					<span className="drivevault-trigger-status">
						{ providers?.google?.isConnected
							? __(
									'Connected',
									'drivevault-for-easy-digital-download'
							  )
							: __(
									'Not Connected',
									'drivevault-for-easy-digital-download'
							  ) }
					</span>
				</div>

				<Icon
					name={ isOpen ? 'expand_less' : 'expand_more' }
					size={ 18 }
					className="drivevault-trigger-chevron"
				/>
			</button>

			{ /* Floating Dropdown */ }
			{ isOpen && (
				<div className="drivevault-accounts-dropdown">
					{ /* Header */ }
					<div className="drivevault-accounts-dropdown__header">
						<div className="drivevault-dropdown-user-info">
							{ currentUser?.avatarUrl && ! imgError ? (
								<img
									src={ currentUser.avatarUrl }
									alt=""
									className="drivevault-dropdown-avatar"
								/>
							) : (
								<div className="drivevault-dropdown-avatar-fallback">
									{ userInitial }
								</div>
							) }
							<div>
								<h4 className="drivevault-user-name">
									{ currentUser?.displayName ||
										__(
											'WordPress Admin',
											'drivevault-for-easy-digital-download'
										) }
								</h4>
								<p className="drivevault-user-email">
									{ currentUser?.userEmail ||
										__(
											'Cloud Storage Overview',
											'drivevault-for-easy-digital-download'
										) }
								</p>
							</div>
						</div>
						<span
							className={ `drivevault-dropdown-count-badge ${
								providers?.google?.isConnected
									? 'is-connected'
									: ''
							}` }
						>
							{ providers?.google?.isConnected
								? __(
										'Connected',
										'drivevault-for-easy-digital-download'
								  )
								: __(
										'Not Connected',
										'drivevault-for-easy-digital-download'
								  ) }
						</span>
					</div>

					{ /* Provider Items */ }
					<div className="drivevault-accounts-dropdown__list">
						{ /* 1. Google Drive */ }
						<div
							className="drivevault-dropdown-provider-item"
							onClick={ () => handleItemClick( 'api', 'google' ) }
							role="button"
							tabIndex={ 0 }
						>
							<div className="drivevault-provider-item-icon drivevault-provider-item-icon--google">
								<svg
									width="22"
									height="22"
									viewBox="0 0 87.3 78"
									aria-hidden="true"
								>
									<path
										d="m6.6 66.85 3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3l12.3-21.3H0c0 1.5.4 3 1.2 4.35z"
										fill="#0066da"
									/>
									<path
										d="M43.65 25 29.35 0c-1.3.8-2.4 1.9-3.2 3.3L1.2 46.45c-.8 1.35-1.2 2.85-1.2 4.35h25.95z"
										fill="#00ac47"
									/>
									<path
										d="M73.55 76.8c1.3-.8 2.4-1.9 3.2-3.3l1.6-2.75 7.75-13.45c.8-1.35 1.2-2.85 1.2-4.35H61.4l5.35 10.55z"
										fill="#ea4335"
									/>
									<path
										d="M43.65 25 57.95 0H29.35z"
										fill="#00832d"
									/>
									<path
										d="M57.95 0c-1.3.8-2.4 1.9-3.2 3.3L40.4 28.3l13.9 24.1 14.3-24.8 5.75-9.95c.8-1.4 1.2-2.9 1.2-4.45H57.95z"
										fill="#ffba00"
									/>
									<path
										d="m73.55 76.8-12.15-21H25.95L13.65 76.8c1.3.8 2.8 1.2 4.35 1.2h51.2c1.55 0 3.05-.4 4.35-1.2z"
										fill="#2684fc"
									/>
								</svg>
							</div>
							<div className="drivevault-provider-item-info">
								<span className="drivevault-provider-name">
									{ __(
										'Google Drive',
										'drivevault-for-easy-digital-download'
									) }
								</span>
								<p className="drivevault-provider-detail">
									{ providers.google.isConnected
										? providers.google.email ||
										  __(
												'Active Account',
												'drivevault-for-easy-digital-download'
										  )
										: __(
												'Primary Google Cloud connection',
												'drivevault-for-easy-digital-download'
										  ) }
								</p>
							</div>
							<div className="drivevault-provider-item-status">
								<span
									className={ `drivevault-status-pill ${
										providers.google.isConnected
											? 'is-connected'
											: 'is-disconnected'
									}` }
								>
									<span className="drivevault-status-dot" />
									{ providers.google.isConnected
										? __(
												'Connected',
												'drivevault-for-easy-digital-download'
										  )
										: __(
												'Not Connected',
												'drivevault-for-easy-digital-download'
										  ) }
								</span>
								<Icon
									name="chevron_right"
									size={ 16 }
									className="drivevault-provider-chevron"
								/>
							</div>
						</div>
					</div>

					{ /* Footer */ }
					<div className="drivevault-accounts-dropdown__footer">
						<button
							type="button"
							className="drivevault-dropdown-footer-btn"
							onClick={ () => handleItemClick( 'status' ) }
						>
							<Icon name="pie_chart" size={ 16 } />
							<span>
								{ __(
									'Quota & Status',
									'drivevault-for-easy-digital-download'
								) }
							</span>
						</button>
					</div>
				</div>
			) }
		</div>
	);
};

export default ConnectedAccountsDropdown;
