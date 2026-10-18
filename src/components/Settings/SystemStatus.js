import React, { useState } from 'react';
import { Spinner } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import Icon from '../common/Icon';
import { StatusOverviewSkeleton, Skeleton } from '../common/Skeleton';

export const SystemStatus = ( { onNavigate, cloudStatus } ) => {
	const {
		isLoading = false,
		refresh = () => {},
		providers = {},
	} = cloudStatus || {};
	const { createToast } = useDispatch( 'drivevault/drive' );
	const [ clearingCache, setClearingCache ] = useState( false );

	const handleClearGoogleCache = async () => {
		setClearingCache( true );
		try {
			await apiFetch( {
				path: 'drivevault-edd/v1/drive/flush-cache',
				method: 'POST',
			} );
			createToast(
				__(
					'Google Drive directory cache cleared successfully.',
					'drivevault-for-easy-digital-download'
				),
				'success'
			);
			refresh();
		} catch ( err ) {
			createToast(
				err.message ||
					__(
						'Failed to clear cache.',
						'drivevault-for-easy-digital-download'
					),
				'error'
			);
		} finally {
			setClearingCache( false );
		}
	};

	const env = window.drivevaultData?.environment || {};

	if ( isLoading && ! providers?.google ) {
		return <StatusOverviewSkeleton />;
	}

	return (
		<div className="drivevault-settings-section drivevault-system-status-page">
			{ /* 1. Google Drive Storage & Quota Card */ }
			<div className="drivevault-ui-card">
				<div className="drivevault-ui-card__header">
					<div className="drivevault-card-header-flex">
						<div className="drivevault-header-title-with-icon">
							<div className="drivevault-status-icon-wrap drivevault-status-icon-wrap--google">
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
							<div>
								<h2>
									{ __(
										'Google Drive Storage & Quota',
										'drivevault-for-easy-digital-download'
									) }
								</h2>
								<p className="drivevault-card-header-sub">
									{ providers.google.isConnected
										? sprintf(
												/* translators: %s: Connected Google account email */
												__(
													'Connected account: %s',
													'drivevault-for-easy-digital-download'
												),
												providers.google.email
										  )
										: __(
												'Live overview of your Google Cloud storage usage and limits.',
												'drivevault-for-easy-digital-download'
										  ) }
								</p>
							</div>
						</div>

						<div className="drivevault-card-header-actions">
							{ providers.google.isConnected ? (
								<button
									type="button"
									className="drivevault-btn drivevault-btn--secondary drivevault-btn--sm"
									onClick={ handleClearGoogleCache }
									disabled={ clearingCache }
								>
									{ clearingCache ? (
										<>
											<Spinner />
											<span>
												{ __(
													'Clearing...',
													'drivevault-for-easy-digital-download'
												) }
											</span>
										</>
									) : (
										<>
											<Icon
												name="cleaning_services"
												size={ 15 }
											/>
											<span>
												{ __(
													'Flush Cache',
													'drivevault-for-easy-digital-download'
												) }
											</span>
										</>
									) }
								</button>
							) : (
								<button
									type="button"
									className="drivevault-btn drivevault-btn--primary drivevault-btn--sm"
									onClick={ () =>
										onNavigate &&
										onNavigate( 'api', 'google' )
									}
								>
									<Icon name="link" size={ 15 } />
									<span>
										{ __(
											'Connect Google Drive',
											'drivevault-for-easy-digital-download'
										) }
									</span>
								</button>
							) }
						</div>
					</div>
				</div>

				<div className="drivevault-ui-card__body">
					{ ! providers.google.isConnected ? (
						<div className="drivevault-status-empty-box">
							<p className="drivevault-text-muted">
								{ __(
									'Google Drive is not connected yet. Connect your account in API & Connection to view live quota metrics.',
									'drivevault-for-easy-digital-download'
								) }
							</p>
							<button
								type="button"
								className="drivevault-btn drivevault-btn--primary drivevault-btn--sm"
								onClick={ () =>
									onNavigate && onNavigate( 'api', 'google' )
								}
							>
								{ __(
									'Go to Google Drive Settings',
									'drivevault-for-easy-digital-download'
								) }
							</button>
						</div>
					) : providers.google.quota ? (
						<div className="drivevault-quota-wrapper">
							<div className="drivevault-quota-metrics">
								<div className="drivevault-quota-metric">
									<span className="drivevault-metric-label">
										{ __(
											'Space Used',
											'drivevault-for-easy-digital-download'
										) }
									</span>
									<span className="drivevault-metric-val">
										{
											providers.google.quota
												.usage_formatted
										}
									</span>
								</div>
								<div className="drivevault-quota-metric">
									<span className="drivevault-metric-label">
										{ __(
											'Total Storage',
											'drivevault-for-easy-digital-download'
										) }
									</span>
									<span className="drivevault-metric-val">
										{
											providers.google.quota
												.limit_formatted
										}
									</span>
								</div>
								<div className="drivevault-quota-metric">
									<span className="drivevault-metric-label">
										{ __(
											'Usage Percentage',
											'drivevault-for-easy-digital-download'
										) }
									</span>
									<span className="drivevault-metric-val">
										{ providers.google.quota.percent_used }%
									</span>
								</div>
							</div>

							<div className="drivevault-progress-track">
								<div
									className="drivevault-progress-fill"
									style={ {
										width: `${ Math.min(
											100,
											providers.google.quota.percent_used
										) }%`,
										backgroundColor:
											providers.google.quota
												.percent_used > 85
												? '#d93025'
												: '#1a73e8',
									} }
								/>
							</div>
						</div>
					) : (
						<div
							className="drivevault-quota-wrapper drivevault-skeleton-wrapper"
							aria-hidden="true"
						>
							<div className="drivevault-quota-metrics">
								<div className="drivevault-quota-metric drivevault-skeleton-card">
									<div className="drivevault-skeleton drivevault-skeleton--label"></div>
									<div className="drivevault-skeleton drivevault-skeleton--val"></div>
								</div>
								<div className="drivevault-quota-metric drivevault-skeleton-card">
									<div className="drivevault-skeleton drivevault-skeleton--label"></div>
									<div className="drivevault-skeleton drivevault-skeleton--val"></div>
								</div>
								<div className="drivevault-quota-metric drivevault-skeleton-card">
									<div className="drivevault-skeleton drivevault-skeleton--label"></div>
									<div className="drivevault-skeleton drivevault-skeleton--val"></div>
								</div>
							</div>
							<div className="drivevault-progress-track drivevault-skeleton-progress">
								<div className="drivevault-skeleton drivevault-skeleton--bar"></div>
							</div>
						</div>
					) }
				</div>
			</div>

			{ /* System Requirements & Environment */ }
			<div className="drivevault-ui-card">
				<div className="drivevault-ui-card__header">
					<h2>
						{ __(
							'System Environment Check',
							'drivevault-for-easy-digital-download'
						) }
					</h2>
					<p className="drivevault-card-header-sub">
						{ __(
							'Server extensions, PHP environment, and Easy Digital Downloads compatibility.',
							'drivevault-for-easy-digital-download'
						) }
					</p>
				</div>
				<div className="drivevault-ui-card__body">
					<table className="drivevault-status-table">
						<tbody>
							<tr>
								<td>
									<strong>
										{ __(
											'PHP Version',
											'drivevault-for-easy-digital-download'
										) }
									</strong>
								</td>
								<td>
									<span className="drivevault-tag drivevault-tag--success">
										<Icon name="check" size={ 14 } />{ ' ' }
										{ env.phpVersion || 'PHP 7.4+' }
									</span>
								</td>
							</tr>
							<tr>
								<td>
									<strong>
										{ __(
											'cURL Extension',
											'drivevault-for-easy-digital-download'
										) }
									</strong>
								</td>
								<td>
									<span className="drivevault-tag drivevault-tag--success">
										<Icon name="check" size={ 14 } />
										{ env.curlVersion
											? sprintf(
													/* translators: %s: cURL library version */
													__(
														'Enabled (%s)',
														'drivevault-for-easy-digital-download'
													),
													env.curlVersion
											  )
											: __(
													'Enabled (Required for Cloud APIs)',
													'drivevault-for-easy-digital-download'
											  ) }
									</span>
								</td>
							</tr>
							<tr>
								<td>
									<strong>
										{ __(
											'OpenSSL / HTTPS',
											'drivevault-for-easy-digital-download'
										) }
									</strong>
								</td>
								<td>
									<span className="drivevault-tag drivevault-tag--success">
										<Icon name="check" size={ 14 } />
										{ env.openssl
											? __(
													'Supported',
													'drivevault-for-easy-digital-download'
											  )
											: __(
													'Checking...',
													'drivevault-for-easy-digital-download'
											  ) }
									</span>
								</td>
							</tr>
							<tr>
								<td>
									<strong>
										{ __(
											'PHP Memory Limit',
											'drivevault-for-easy-digital-download'
										) }
									</strong>
								</td>
								<td>
									<span className="drivevault-tag drivevault-tag--success">
										<Icon name="check" size={ 14 } />{ ' ' }
										{ env.memoryLimit || '256M' }
									</span>
								</td>
							</tr>
							<tr>
								<td>
									<strong>
										{ __(
											'Max Execution Time',
											'drivevault-for-easy-digital-download'
										) }
									</strong>
								</td>
								<td>
									<span className="drivevault-tag drivevault-tag--success">
										<Icon name="check" size={ 14 } />{ ' ' }
										{ env.maxExecutionTime || '30s' }
									</span>
								</td>
							</tr>
							<tr>
								<td>
									<strong>
										{ __(
											'Easy Digital Downloads Engine',
											'drivevault-for-easy-digital-download'
										) }
									</strong>
								</td>
								<td>
									<span className="drivevault-tag drivevault-tag--success">
										<Icon name="check" size={ 14 } />
										{ env.eddVersion || env.wcVersion
											? sprintf(
													/* translators: %s: Easy Digital Downloads version */
													__(
														'Active (v%s)',
														'drivevault-for-easy-digital-download'
													),
													env.eddVersion ||
														env.wcVersion
											  )
											: __(
													'Active',
													'drivevault-for-easy-digital-download'
											  ) }
									</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default SystemStatus;
