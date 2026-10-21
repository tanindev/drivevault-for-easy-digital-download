import {
	RadioControl,
	RangeControl,
	ToggleControl,
	TextareaControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export const DownloadSettings = ( {
	settings,
	onChange,
	onNavigateTab,
	onRegisterChildSave,
} ) => {
	const hasStreamSupport =
		!! settings?.available_download_methods?.includes( 'stream' );
	const effectiveMethod = hasStreamSupport
		? settings?.download_method || 'redirect'
		: 'redirect';

	return (
		<div className="drivevault-settings-section">
			<div className="drivevault-ui-card">
				<div className="drivevault-ui-card__header">
					<h2>
						{ __(
							'Download & Delivery Options',
							'drivevault-for-easy-digital-downloads'
						) }
					</h2>
					<p className="drivevault-card-header-sub">
						{ __(
							'Configure how customer downloadable files are streamed and cached.',
							'drivevault-for-easy-digital-downloads'
						) }
					</p>
				</div>
				<div className="drivevault-ui-card__body">
					<div className="drivevault-form-vertical">
						{ /* Modern Delivery Method Selection Cards */ }
						<div className="drivevault-delivery-method-group">
							<label className="drivevault-section-sublabel">
								{ __(
									'Customer Download Delivery Method',
									'drivevault-for-easy-digital-downloads'
								) }
							</label>
							<p className="drivevault-section-desc">
								{ __(
									'Choose how customer download requests are processed and delivered after purchase verification.',
									'drivevault-for-easy-digital-downloads'
								) }
							</p>

							<div className="drivevault-delivery-cards-grid">
								{ /* Card 1: Direct Cloud Redirect */ }
								<div
									className={ `drivevault-delivery-card ${
										effectiveMethod === 'redirect'
											? 'is-selected'
											: ''
									}` }
									onClick={ () => {
										if ( hasStreamSupport ) {
											onChange(
												'download_method',
												'redirect'
											);
										}
									} }
									role="button"
									tabIndex={ hasStreamSupport ? 0 : -1 }
									onKeyDown={ ( e ) => {
										if (
											hasStreamSupport &&
											( e.key === 'Enter' ||
												e.key === ' ' )
										) {
											onChange(
												'download_method',
												'redirect'
											);
										}
									} }
								>
									<div className="drivevault-delivery-card__header">
										<div className="drivevault-delivery-card__title-wrap">
											<div className="drivevault-delivery-card__icon drivevault-delivery-card__icon--redirect">
												<svg
													width="22"
													height="22"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
													<polyline points="7 10 12 15 17 10" />
													<line
														x1="12"
														y1="15"
														x2="12"
														y2="3"
													/>
												</svg>
											</div>
											<div>
												<h4 className="drivevault-delivery-card__title">
													{ __(
														'Direct Cloud Redirect',
														'drivevault-for-easy-digital-downloads'
													) }
												</h4>
												<span className="drivevault-delivery-card__speed">
													{ __(
														'Fast Cloud CDN Transfer',
														'drivevault-for-easy-digital-downloads'
													) }
												</span>
											</div>
										</div>
										<div className="drivevault-delivery-card__status">
											{ effectiveMethod === 'redirect' ? (
												<span className="drivevault-card-badge drivevault-card-badge--active">
													<svg
														width="13"
														height="13"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2.5"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
														<polyline points="22 4 12 14.01 9 11.01" />
													</svg>
													{ __(
														'Active Method',
														'drivevault-for-easy-digital-downloads'
													) }
												</span>
											) : (
												<span className="drivevault-card-badge drivevault-card-badge--ready">
													{ __(
														'Select',
														'drivevault-for-easy-digital-downloads'
													) }
												</span>
											) }
										</div>
									</div>

									<p className="drivevault-delivery-card__description">
										{ __(
											'Customers are securely verified by Easy Digital Downloads and redirected directly to time-limited signed links from Google Drive.',
											'drivevault-for-easy-digital-downloads'
										) }
									</p>

									<div className="drivevault-delivery-card__features">
										<div className="drivevault-card-feature-item">
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#16a34a"
												strokeWidth="2.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<polyline points="20 6 9 17 4 12" />
											</svg>
											<span>
												{ __(
													'Zero web server bandwidth & memory load',
													'drivevault-for-easy-digital-downloads'
												) }
											</span>
										</div>
										<div className="drivevault-card-feature-item">
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#16a34a"
												strokeWidth="2.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<polyline points="20 6 9 17 4 12" />
											</svg>
											<span>
												{ __(
													'Direct high-speed transfer via cloud edge',
													'drivevault-for-easy-digital-downloads'
												) }
											</span>
										</div>
										<div className="drivevault-card-feature-item">
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#16a34a"
												strokeWidth="2.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<polyline points="20 6 9 17 4 12" />
											</svg>
											<span>
												{ __(
													'Standard across all active cloud providers',
													'drivevault-for-easy-digital-downloads'
												) }
											</span>
										</div>
									</div>
								</div>

								{ /* Card 2: Server-Side Proxy Streaming (Pro Feature - Only shown if Pro streaming engine active) */ }
								{ hasStreamSupport && (
									<div
										className={ `drivevault-delivery-card ${
											effectiveMethod === 'stream'
												? 'is-selected'
												: ''
										}` }
										onClick={ () =>
											onChange(
												'download_method',
												'stream'
											)
										}
										role="button"
										tabIndex={ 0 }
										onKeyDown={ ( e ) => {
											if (
												e.key === 'Enter' ||
												e.key === ' '
											) {
												onChange(
													'download_method',
													'stream'
												);
											}
										} }
									>
										<div className="drivevault-delivery-card__header">
											<div className="drivevault-delivery-card__title-wrap">
												<div className="drivevault-delivery-card__icon drivevault-delivery-card__icon--stream">
													<svg
														width="22"
														height="22"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<rect
															x="2"
															y="2"
															width="20"
															height="8"
															rx="2"
															ry="2"
														/>
														<rect
															x="2"
															y="14"
															width="20"
															height="8"
															rx="2"
															ry="2"
														/>
														<line
															x1="6"
															y1="6"
															x2="6.01"
															y2="6"
														/>
														<line
															x1="6"
															y1="18"
															x2="6.01"
															y2="18"
														/>
													</svg>
												</div>
												<div>
													<h4 className="drivevault-delivery-card__title">
														{ __(
															'Server-Side Proxy Streaming',
															'drivevault-for-easy-digital-downloads'
														) }
													</h4>
													<span className="drivevault-delivery-card__speed">
														{ __(
															'Full Link Concealment',
															'drivevault-for-easy-digital-downloads'
														) }
													</span>
												</div>
											</div>
											<div className="drivevault-delivery-card__status">
												{ effectiveMethod ===
												'stream' ? (
													<span className="drivevault-card-badge drivevault-card-badge--active">
														<svg
															width="13"
															height="13"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2.5"
															strokeLinecap="round"
															strokeLinejoin="round"
														>
															<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
															<polyline points="22 4 12 14.01 9 11.01" />
														</svg>
														{ __(
															'Active Method',
															'drivevault-for-easy-digital-downloads'
														) }
													</span>
												) : (
													<span className="drivevault-card-badge drivevault-card-badge--ready">
														{ __(
															'Select',
															'drivevault-for-easy-digital-downloads'
														) }
													</span>
												) }
											</div>
										</div>

										<p className="drivevault-delivery-card__description">
											{ __(
												'Streams downloads in chunks directly through your WordPress server, completely hiding external cloud URLs and supporting resumable transfers.',
												'drivevault-for-easy-digital-downloads'
											) }
										</p>

										<div className="drivevault-delivery-card__features">
											<div className="drivevault-card-feature-item">
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="#7c3aed"
													strokeWidth="2.5"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<polyline points="20 6 9 17 4 12" />
												</svg>
												<span>
													{ __(
														'100% URL concealment (never exposes drive links)',
														'drivevault-for-easy-digital-downloads'
													) }
												</span>
											</div>
											<div className="drivevault-card-feature-item">
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="#7c3aed"
													strokeWidth="2.5"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<polyline points="20 6 9 17 4 12" />
												</svg>
												<span>
													{ __(
														'HTTP Range 206 chunked resumable downloads',
														'drivevault-for-easy-digital-downloads'
													) }
												</span>
											</div>
											<div className="drivevault-card-feature-item">
												<svg
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="#7c3aed"
													strokeWidth="2.5"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<polyline points="20 6 9 17 4 12" />
												</svg>
												<span>
													{ __(
														'Configurable 1–32 MB memory buffer size',
														'drivevault-for-easy-digital-downloads'
													) }
												</span>
											</div>
										</div>
									</div>
								) }
							</div>
						</div>

						<hr className="drivevault-divider" />

						<TextareaControl
							label={ __(
								'Cloud Storage Disconnected / Inaccessible Error Message',
								'drivevault-for-easy-digital-downloads'
							) }
							value={
								settings?.error_message_disconnected ??
								__(
									'Error accessing file: Cloud storage account is not connected.',
									'drivevault-for-easy-digital-downloads'
								)
							}
							onChange={ ( val ) =>
								onChange( 'error_message_disconnected', val )
							}
							rows={ 2 }
							help={ __(
								'Message displayed to customers when attempting to download a cloud file while the storage provider is disconnected or inaccessible.',
								'drivevault-for-easy-digital-downloads'
							) }
							placeholder={ __(
								'Error accessing file: Cloud storage account is not connected.',
								'drivevault-for-easy-digital-downloads'
							) }
						/>

						<hr className="drivevault-divider" />

						{ settings?.available_download_methods?.includes(
							'stream'
						) && (
							<>
								<RangeControl
									label={ __(
										'Stream Chunk Buffer Size (MB)',
										'drivevault-for-easy-digital-downloads'
									) }
									value={ settings?.chunk_size_mb || 8 }
									onChange={ ( val ) =>
										onChange( 'chunk_size_mb', val )
									}
									min={ 1 }
									max={ 32 }
									help={ __(
										'Memory buffer size in megabytes used when streaming large files from cloud storage.',
										'drivevault-for-easy-digital-downloads'
									) }
								/>
								<hr className="drivevault-divider" />
							</>
						) }

						<ToggleControl
							label={ __(
								'Enable Shared / Team Drives',
								'drivevault-for-easy-digital-downloads'
							) }
							checked={ !! settings?.enable_shared_drive }
							onChange={ ( val ) =>
								onChange( 'enable_shared_drive', val )
							}
							help={ __(
								'Allow browsing and linking downloadable files from Google Workspace Shared Drives (Team Drives).',
								'drivevault-for-easy-digital-downloads'
							) }
						/>

						<hr className="drivevault-divider" />

						<RangeControl
							label={ __(
								'Drive Directory Cache TTL (Minutes)',
								'drivevault-for-easy-digital-downloads'
							) }
							value={ Math.round(
								( settings?.cache_ttl || 600 ) / 60
							) }
							onChange={ ( val ) =>
								onChange( 'cache_ttl', val * 60 )
							}
							min={ 1 }
							max={ 120 }
							help={ __(
								'How long Google Drive file listings are cached in WordPress transients before refetching.',
								'drivevault-for-easy-digital-downloads'
							) }
						/>

						<hr className="drivevault-divider" />

						<RangeControl
							label={ __(
								'Download Activity Log Retention (Days)',
								'drivevault-for-easy-digital-downloads'
							) }
							value={
								typeof settings?.log_retention_days !==
								'undefined'
									? Number( settings.log_retention_days )
									: 60
							}
							onChange={ ( val ) =>
								onChange( 'log_retention_days', val )
							}
							min={ 7 }
							max={ 365 }
							help={ __(
								'Number of days download activity and audit logs are retained before automatic cleanup by daily WP-Cron.',
								'drivevault-for-easy-digital-downloads'
							) }
						/>

						<hr className="drivevault-divider" />

						<ToggleControl
							label={ __(
								'Anonymize Customer Download IP Addresses (GDPR Compliance)',
								'drivevault-for-easy-digital-downloads'
							) }
							checked={ !! settings?.anonymize_download_ips }
							onChange={ ( val ) =>
								onChange( 'anonymize_download_ips', val )
							}
							help={ __(
								'Mask the last octet of customer IP addresses in download activity logs for privacy and GDPR compliance.',
								'drivevault-for-easy-digital-downloads'
							) }
						/>

						<hr className="drivevault-divider" />

						<ToggleControl
							label={ __(
								'Erase Plugin Data on Uninstall',
								'drivevault-for-easy-digital-downloads'
							) }
							checked={ !! settings?.delete_data_on_uninstall }
							onChange={ ( val ) =>
								onChange( 'delete_data_on_uninstall', val )
							}
							help={ __(
								'Check to delete stored Google tokens, settings, and download logs if the plugin is deleted.',
								'drivevault-for-easy-digital-downloads'
							) }
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DownloadSettings;
