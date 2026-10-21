import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import Icon from './common/Icon';
import FileIcon from './common/FileIcon';
import { FileListSkeleton } from './common/Skeleton';

const GOOGLE_DRIVE_SVG = (
	<svg
		width="16"
		height="16"
		viewBox="0 0 87.3 78"
		xmlns="http://www.w3.org/2000/svg"
		style={ {
			verticalAlign: 'middle',
			display: 'inline-block',
			flexShrink: 0,
		} }
	>
		<path
			d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
			fill="#0066da"
		/>
		<path
			d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z"
			fill="#00ac47"
		/>
		<path
			d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z"
			fill="#ea4335"
		/>
		<path
			d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
			fill="#00832d"
		/>
		<path
			d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
			fill="#2684fc"
		/>
		<path
			d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
			fill="#ffba00"
		/>
	</svg>
);

const DROPBOX_SVG = (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="#0061fe"
		xmlns="http://www.w3.org/2000/svg"
		style={ {
			verticalAlign: 'middle',
			display: 'inline-block',
			flexShrink: 0,
		} }
	>
		<path d="M6 2l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zm12 0l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zm-6 12l6 4-6 4-6-4 6-4z" />
	</svg>
);

const ONEDRIVE_SVG = (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		style={ {
			verticalAlign: 'middle',
			display: 'inline-block',
			flexShrink: 0,
		} }
	>
		<path
			d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
			fill="#0078D4"
		/>
		<circle cx="13" cy="12" r="3" fill="#ffffff" fillOpacity="0.4" />
	</svg>
);

const S3_SVG = (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		style={ {
			verticalAlign: 'middle',
			display: 'inline-block',
			flexShrink: 0,
		} }
	>
		<path
			d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
			fill="#FF9900"
		/>
	</svg>
);

const formatBytes = ( bytes ) => {
	if ( ! bytes || bytes === 0 ) return '';
	const k = 1024;
	const sizes = [ 'B', 'KB', 'MB', 'GB', 'TB' ];
	const i = Math.floor( Math.log( bytes ) / Math.log( k ) );
	return (
		parseFloat( ( bytes / Math.pow( k, i ) ).toFixed( 1 ) ) +
		' ' +
		sizes[ i ]
	);
};

export const FilePickerModal = ( { isOpen, onClose, onInsertFiles } ) => {
	const googleConnection = useSelect(
		( select ) =>
			select( 'drivevault/drive' )?.getConnectionStatus?.() || {
				is_connected: window.drivevaultData?.isConnected || false,
			},
		[]
	);
	const { fetchStatus: fetchGoogleStatus } =
		useDispatch( 'drivevault/drive' ) || {};

	// Storage providers configuration
	const isGoogleConnected = !! (
		googleConnection?.is_connected || window.drivevaultData?.isConnected
	);

	const providers = [
		{
			id: 'gdrive',
			name: __( 'Google Drive', 'drivevault-for-easy-digital-downloads' ),
			icon: GOOGLE_DRIVE_SVG,
			avatarBg: '#eff6ff',
			isConnected: isGoogleConnected,
			settingsUrl:
				window.drivevaultData?.gdriveSettingsUrl ||
				'admin.php?page=drivevault-settings',
			rootTarget: 'root',
			rootName: __( 'My Drive', 'drivevault-for-easy-digital-downloads' ),
			searchPlaceholder: __(
				'Search files in Google Drive...',
				'drivevault-for-easy-digital-downloads'
			),
		},
	];

	// Active provider state: Google Drive
	const [ activeProviderId, setActiveProviderId ] = useState( 'gdrive' );

	// Files and navigation state
	const [ files, setFiles ] = useState( [] );
	const [ breadcrumbs, setBreadcrumbs ] = useState( [] );
	const [ searchQuery, setSearchQuery ] = useState( '' );
	const [ selectedFiles, setSelectedFiles ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ activeCategory, setActiveCategory ] = useState( 'all' );
	const [ sortBy, setSortBy ] = useState( 'name_asc' );

	const matchesCategory = ( file, category ) => {
		if ( category === 'all' || file.is_folder ) return true;
		const ext = ( file.name || '' ).split( '.' ).pop().toLowerCase();
		const mime = ( file.mime_type || '' ).toLowerCase();

		if ( category === 'docs' ) {
			return (
				[
					'pdf',
					'doc',
					'docx',
					'txt',
					'rtf',
					'odt',
					'epub',
					'mobi',
					'ppt',
					'pptx',
					'xls',
					'xlsx',
				].includes( ext ) ||
				mime.includes( 'pdf' ) ||
				mime.includes( 'word' ) ||
				mime.includes( 'document' ) ||
				mime.includes( 'text' )
			);
		}
		if ( category === 'archives' ) {
			return (
				[
					'zip',
					'rar',
					'7z',
					'tar',
					'gz',
					'bz2',
					'iso',
					'dmg',
				].includes( ext ) ||
				mime.includes( 'zip' ) ||
				mime.includes( 'compressed' ) ||
				mime.includes( 'archive' ) ||
				mime.includes( 'tar' )
			);
		}
		if ( category === 'media' ) {
			return (
				[
					'mp4',
					'mov',
					'avi',
					'mkv',
					'webm',
					'wmv',
					'mp3',
					'wav',
					'aac',
					'flac',
					'ogg',
					'm4a',
				].includes( ext ) ||
				mime.includes( 'video' ) ||
				mime.includes( 'audio' )
			);
		}
		if ( category === 'images' ) {
			return (
				[
					'jpg',
					'jpeg',
					'png',
					'gif',
					'webp',
					'svg',
					'bmp',
					'tiff',
					'psd',
					'ai',
					'raw',
				].includes( ext ) || mime.includes( 'image' )
			);
		}
		return true;
	};

	const displayedFiles = useMemo( () => {
		const list = ( files || [] ).filter( ( f ) =>
			matchesCategory( f, activeCategory )
		);
		list.sort( ( a, b ) => {
			if ( a.is_folder && ! b.is_folder ) return -1;
			if ( ! a.is_folder && b.is_folder ) return 1;

			if ( sortBy === 'name_asc' ) {
				return ( a.name || '' ).localeCompare( b.name || '' );
			}
			if ( sortBy === 'name_desc' ) {
				return ( b.name || '' ).localeCompare( a.name || '' );
			}
			if ( sortBy === 'size_desc' ) {
				return ( b.size || 0 ) - ( a.size || 0 );
			}
			if ( sortBy === 'size_asc' ) {
				return ( a.size || 0 ) - ( b.size || 0 );
			}
			return 0;
		} );
		return list;
	}, [ files, activeCategory, sortBy ] );

	const totalSelectedSize = useMemo( () => {
		return selectedFiles.reduce(
			( acc, f ) => acc + ( Number( f.size ) || 0 ),
			0
		);
	}, [ selectedFiles ] );

	const handleSelectAllVisible = () => {
		const selectables = displayedFiles.filter( ( f ) => ! f.is_folder );
		setSelectedFiles( selectables );
	};

	// Custom Modern Confirmation Dialog state for unauthorized providers
	const [ showConfirmModal, setShowConfirmModal ] = useState( false );
	const [ pendingProvider, setPendingProvider ] = useState( null );

	const currentProvider =
		providers.find( ( p ) => p.id === activeProviderId ) || providers[ 0 ];

	const onCloseRef = useRef( onClose );
	onCloseRef.current = onClose;

	// Handle ESC key to close
	useEffect( () => {
		if ( ! isOpen ) return;

		const handleKeyDown = ( e ) => {
			if ( e.key === 'Escape' ) {
				e.stopPropagation();
				if ( showConfirmModal ) {
					setShowConfirmModal( false );
				} else {
					onCloseRef.current?.();
				}
			}
		};

		document.addEventListener( 'keydown', handleKeyDown );
		return () => document.removeEventListener( 'keydown', handleKeyDown );
	}, [ isOpen, showConfirmModal ] );

	// Fetch files for a given provider and folder target
	const loadFiles = useCallback(
		async ( providerId, target, query = '' ) => {
			setIsLoading( true );
			setError( null );

			let normalizedTarget = target;
			if ( providerId === 'dropbox' || providerId === 's3' ) {
				if ( normalizedTarget === 'root' || ! normalizedTarget ) {
					normalizedTarget = '';
				}
			} else if ( providerId === 'gdrive' || providerId === 'onedrive' ) {
				if ( ! normalizedTarget ) {
					normalizedTarget = 'root';
				}
			}

			try {
				let fetchedFiles = [];

				if ( providerId === 'gdrive' ) {
					const path = query
						? `drivevault-edd/v1/drive/files?search=${ encodeURIComponent(
								query
						  ) }`
						: `drivevault-edd/v1/drive/files?folder_id=${ encodeURIComponent(
								normalizedTarget
						  ) }`;
					const res = await apiFetch( { path } );
					fetchedFiles = ( res.files || [] ).map( ( f ) => ( {
						id: f.id,
						name: f.name,
						is_folder: !! f.is_folder,
						size: f.size || 0,
						size_formatted:
							f.size_formatted || formatBytes( f.size ),
						mime_type:
							f.mime_type || ( f.is_folder ? 'folder' : 'file' ),
						provider: 'gdrive',
						download_url:
							f.download_url || `gdrive://file/${ f.id }`,
					} ) );
				} else if ( providerId === 'dropbox' ) {
					const path = query
						? `drivevault-dropbox/v1/search?query=${ encodeURIComponent(
								query
						  ) }`
						: `drivevault-dropbox/v1/files?path=${ encodeURIComponent(
								normalizedTarget || ''
						  ) }`;
					const res = await apiFetch( { path } );
					const entries = res.entries || [];
					entries.sort( ( a, b ) => {
						if ( a.is_folder && ! b.is_folder ) return -1;
						if ( ! a.is_folder && b.is_folder ) return 1;
						return ( a.name || '' ).localeCompare( b.name || '' );
					} );
					fetchedFiles = entries.map( ( e ) => {
						const filePath =
							e.path_display || e.path_lower || e.name || e.id;
						const cleanPath = String( filePath ).replace(
							/^\/+/,
							''
						);
						return {
							id: e.id || e.path_lower || e.name,
							name: e.name,
							is_folder: !! e.is_folder,
							size: e.size || 0,
							size_formatted: e.is_folder
								? 'Folder'
								: formatBytes( e.size ),
							mime_type: e.is_folder
								? 'folder'
								: e.name.split( '.' ).pop() || 'file',
							path: filePath,
							provider: 'dropbox',
							download_url: `dropbox://file/${ cleanPath }`,
						};
					} );
				} else if ( providerId === 'onedrive' ) {
					const path = query
						? `drivevault-onedrive/v1/search?query=${ encodeURIComponent(
								query
						  ) }`
						: `drivevault-onedrive/v1/files?item_id=${ encodeURIComponent(
								normalizedTarget || 'root'
						  ) }`;
					const res = await apiFetch( { path } );
					const entries = res.entries || [];
					entries.sort( ( a, b ) => {
						if ( a.is_folder && ! b.is_folder ) return -1;
						if ( ! a.is_folder && b.is_folder ) return 1;
						return ( a.name || '' ).localeCompare( b.name || '' );
					} );
					fetchedFiles = entries.map( ( item ) => ( {
						id: item.id,
						name: item.name,
						is_folder: !! item.is_folder,
						size: item.size || 0,
						size_formatted: item.is_folder
							? item.child_count
								? `${ item.child_count } items`
								: 'Folder'
							: formatBytes( item.size ),
						mime_type: item.is_folder
							? 'folder'
							: item.name.split( '.' ).pop() || 'file',
						provider: 'onedrive',
						download_url: `onedrive://file/${ String(
							item.id
						).replace( /^\/+/, '' ) }`,
					} ) );
				} else if ( providerId === 's3' ) {
					const path = query
						? `drivevault-s3/v1/search?query=${ encodeURIComponent(
								query
						  ) }`
						: `drivevault-s3/v1/files?prefix=${ encodeURIComponent(
								normalizedTarget || ''
						  ) }`;
					const res = await apiFetch( { path } );
					const bucket =
						res.bucket || window.drivevaultData?.amazonBucket || '';
					const folders = ( res.folders || [] ).map( ( f ) => {
						const cleanPrefix = String( f.prefix || '' ).replace(
							/^\/+/,
							''
						);
						return {
							id: f.prefix,
							name: f.name,
							is_folder: true,
							prefix: f.prefix,
							size_formatted: 'Folder',
							mime_type: 'folder',
							provider: 's3',
							download_url: bucket
								? `s3://file/${ bucket.replace(
										/^\/+|\/+$/g,
										''
								  ) }/${ cleanPrefix }`
								: `s3://file/${ cleanPrefix }`,
						};
					} );
					const fileItems = ( res.files || [] ).map( ( f ) => {
						const cleanKey = String( f.key || '' ).replace(
							/^\/+/,
							''
						);
						const b = f.bucket || bucket;
						return {
							id: f.key,
							name: f.name,
							is_folder: false,
							size: f.size || 0,
							size_formatted:
								f.sizeFormatted || formatBytes( f.size ),
							mime_type: f.name.split( '.' ).pop() || 'file',
							key: f.key,
							bucket: b,
							provider: 's3',
							download_url: b
								? `s3://file/${ b.replace(
										/^\/+|\/+$/g,
										''
								  ) }/${ cleanKey }`
								: `s3://file/${ cleanKey }`,
						};
					} );
					fetchedFiles = [ ...folders, ...fileItems ];
				}

				setFiles( fetchedFiles );
			} catch ( err ) {
				setError(
					err.message ||
						sprintf(
							/* translators: %s: provider name */
							__(
								'Failed to load files from %s.',
								'drivevault-for-easy-digital-downloads'
							),
							currentProvider.name
						)
				);
				setFiles( [] );
			} finally {
				setIsLoading( false );
			}
		},
		[ currentProvider.name ]
	);

	// Initialize modal when opened or provider changed
	useEffect( () => {
		if ( ! isOpen ) return;

		if ( fetchGoogleStatus ) fetchGoogleStatus();

		const prov =
			providers.find( ( p ) => p.id === activeProviderId ) ||
			providers[ 0 ];
		if ( prov.isConnected ) {
			setBreadcrumbs( [
				{
					target: prov.rootTarget,
					name: prov.rootName,
				},
			] );
			setSearchQuery( '' );
			loadFiles( prov.id, prov.rootTarget, '' );
		}
	}, [ isOpen, activeProviderId ] );

	const handleBackdropClick = ( e ) => {
		if ( e.target === e.currentTarget ) {
			onClose();
		}
	};

	// Switching provider tabs
	const handleTabClick = ( provider ) => {
		if ( ! provider.isConnected ) {
			// Modern confirmation popup instead of browser confirmation
			setPendingProvider( provider );
			setShowConfirmModal( true );
			return;
		}

		if ( activeProviderId !== provider.id ) {
			setActiveProviderId( provider.id );
			setSearchQuery( '' );
			setBreadcrumbs( [
				{
					target: provider.rootTarget,
					name: provider.rootName,
				},
			] );
			loadFiles( provider.id, provider.rootTarget, '' );
		}
	};

	// Folder click
	const handleFolderClick = ( item ) => {
		const target =
			item.prefix !== undefined
				? item.prefix
				: item.path !== undefined
				? item.path
				: item.id;

		setBreadcrumbs( ( prev ) => [
			...prev,
			{
				target,
				name: item.name,
			},
		] );
		setSearchQuery( '' );
		loadFiles( activeProviderId, target, '' );
	};

	// Breadcrumb navigation click
	const handleBreadcrumbClick = ( index ) => {
		const sliced = breadcrumbs.slice( 0, index + 1 );
		setBreadcrumbs( sliced );
		setSearchQuery( '' );
		const target =
			sliced[ sliced.length - 1 ]?.target || currentProvider.rootTarget;
		loadFiles( activeProviderId, target, '' );
	};

	// Refresh folder
	const handleRefresh = () => {
		const current = breadcrumbs[ breadcrumbs.length - 1 ];
		const target = current ? current.target : currentProvider.rootTarget;
		loadFiles( activeProviderId, target, searchQuery );
	};

	// Search input change with debounce
	const handleSearchChange = ( value ) => {
		setSearchQuery( value );
	};

	// Debounced search effect
	useEffect( () => {
		if ( ! currentProvider.isConnected ) return;

		const timer = setTimeout( () => {
			if ( searchQuery.trim().length > 0 ) {
				loadFiles( activeProviderId, null, searchQuery.trim() );
			} else if ( breadcrumbs.length > 0 ) {
				const current = breadcrumbs[ breadcrumbs.length - 1 ];
				loadFiles(
					activeProviderId,
					current ? current.target : currentProvider.rootTarget,
					''
				);
			}
		}, 350 );

		return () => clearTimeout( timer );
	}, [ searchQuery, activeProviderId, currentProvider.isConnected ] );

	// File Selection
	const handleToggleSelect = ( file ) => {
		setSelectedFiles( ( prev ) => {
			const exists = prev.some(
				( f ) => f.id === file.id && f.provider === file.provider
			);
			if ( exists ) {
				return prev.filter(
					( f ) =>
						! ( f.id === file.id && f.provider === file.provider )
				);
			}
			return [ ...prev, file ];
		} );
	};

	const clearSelection = () => setSelectedFiles( [] );

	const handleInsert = () => {
		if ( selectedFiles.length > 0 && onInsertFiles ) {
			onInsertFiles( selectedFiles );
		}
		onClose();
	};

	if ( ! isOpen ) return null;

	return (
		<div
			className="drivevault-modal-overlay"
			onClick={ handleBackdropClick }
			role="dialog"
			aria-modal="true"
		>
			<div
				className="drivevault-modal-window"
				onClick={ ( e ) => e.stopPropagation() }
			>
				{ /* Modal Header */ }
				<div className="drivevault-modal-header">
					<div className="drivevault-modal-header-left">
						<div className="drivevault-modal-header-icon">
							<Icon
								name="cloud_queue"
								size={ 20 }
								color="#1a73e8"
							/>
						</div>
						<div className="drivevault-modal-header-text">
							<h2>
								{ __(
									'Select Downloadable Files from Cloud Storage',
									'drivevault-for-easy-digital-downloads'
								) }
							</h2>
						</div>
					</div>

					<button
						type="button"
						className="drivevault-modal-close-btn"
						onClick={ onClose }
						aria-label={ __(
							'Close modal',
							'drivevault-for-easy-digital-downloads'
						) }
					>
						<Icon name="close" size={ 20 } />
					</button>
				</div>

				{ /* Top Storage Provider Switcher Tabs (Only if multiple providers configured) */ }
				{ providers.length > 1 && (
					<div className="drivevault-modal-provider-tabs">
						{ providers.map( ( prov ) => {
							const isActive = activeProviderId === prov.id;
							return (
								<button
									key={ prov.id }
									type="button"
									className={ `drivevault-provider-tab ${
										isActive ? 'is-active' : ''
									} ${
										! prov.isConnected
											? 'is-unauthorized'
											: 'is-connected'
									}` }
									onClick={ () => handleTabClick( prov ) }
								>
									<span className="drivevault-provider-tab-icon">
										{ prov.icon }
									</span>
									<span className="drivevault-provider-tab-label">
										{ prov.name }
									</span>
									<span
										className={ `drivevault-provider-tab-status-dot ${
											prov.isConnected
												? 'is-connected'
												: 'is-unauthorized'
										}` }
										title={
											prov.isConnected
												? __(
														'Connected',
														'drivevault-for-easy-digital-downloads'
												  )
												: __(
														'Not Connected - Click to configure',
														'drivevault-for-easy-digital-downloads'
												  )
										}
									/>
								</button>
							);
						} ) }
					</div>
				) }

				{ /* Modal Content / Body */ }
				{ ! currentProvider.isConnected ? (
					<div className="drivevault-modal-not-connected-view">
						<div className="drivevault-not-connected-box">
							<div
								className="drivevault-not-connected-icon"
								style={ {
									width: 64,
									height: 64,
									margin: '0 auto 16px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: 16,
									background: currentProvider.avatarBg,
								} }
							>
								{ currentProvider.icon }
							</div>
							<h3>
								{ sprintf(
									/* translators: %s: provider name */
									__(
										'%s is Not Connected',
										'drivevault-for-easy-digital-downloads'
									),
									currentProvider.name
								) }
							</h3>
							<p>
								{ sprintf(
									/* translators: %s: provider name */
									__(
										'Please connect and authorize your %s account in DriveVault settings to browse and select files.',
										'drivevault-for-easy-digital-downloads'
									),
									currentProvider.name
								) }
							</p>
							<a
								href={ currentProvider.settingsUrl }
								target="_blank"
								rel="noreferrer"
								className="drivevault-btn drivevault-btn--primary"
							>
								<Icon name="settings" size={ 18 } />
								<span>
									{ sprintf(
										/* translators: %s: provider name */
										__(
											'Configure %s',
											'drivevault-for-easy-digital-downloads'
										),
										currentProvider.name
									) }
								</span>
							</a>
						</div>
					</div>
				) : (
					<div className="drivevault-modal-layout-container">
						{ /* Fixed Subheader Toolbar (Breadcrumbs + Search) */ }
						<div className="drivevault-modal-toolbar">
							<div className="drivevault-breadcrumbs-bar">
								<nav
									className="drivevault-breadcrumbs-list"
									aria-label={ __(
										'Breadcrumbs',
										'drivevault-for-easy-digital-downloads'
									) }
								>
									{ breadcrumbs.map( ( crumb, idx ) => {
										const isLast =
											idx === breadcrumbs.length - 1;
										return (
											<React.Fragment
												key={ crumb.target || idx }
											>
												{ idx > 0 && (
													<span className="drivevault-breadcrumbs-separator">
														/
													</span>
												) }
												<button
													type="button"
													className={ `drivevault-breadcrumbs-item ${
														isLast
															? 'is-active'
															: ''
													}` }
													onClick={ () =>
														! isLast &&
														handleBreadcrumbClick(
															idx
														)
													}
													disabled={
														isLast || isLoading
													}
												>
													{ idx === 0 && (
														<span
															style={ {
																marginRight: 4,
																display:
																	'inline-flex',
																alignItems:
																	'center',
															} }
														>
															{
																currentProvider.icon
															}
														</span>
													) }
													{ crumb.name }
												</button>
											</React.Fragment>
										);
									} ) }
								</nav>

								<div className="drivevault-breadcrumbs-actions">
									<button
										type="button"
										className="drivevault-btn-icon"
										onClick={ handleRefresh }
										disabled={ isLoading }
										title={ __(
											'Refresh folder',
											'drivevault-for-easy-digital-downloads'
										) }
									>
										<Icon
											name="refresh"
											size={ 16 }
											className={
												isLoading
													? 'drivevault-spin'
													: ''
											}
										/>
									</button>
								</div>
							</div>

							<div className="drivevault-search-bar">
								<div className="drivevault-search-input-wrap">
									<Icon
										name="search"
										size={ 17 }
										className="drivevault-search-icon"
									/>
									<input
										type="text"
										className="drivevault-search-field"
										value={ searchQuery }
										onChange={ ( e ) =>
											handleSearchChange( e.target.value )
										}
										placeholder={
											currentProvider.searchPlaceholder
										}
									/>
									{ searchQuery && (
										<button
											type="button"
											className="drivevault-search-clear"
											onClick={ () =>
												setSearchQuery( '' )
											}
											title={ __(
												'Clear search',
												'drivevault-for-easy-digital-downloads'
											) }
										>
											<Icon name="close" size={ 14 } />
										</button>
									) }
								</div>
							</div>
							<div className="drivevault-modal-filter-bar">
								<div className="drivevault-category-filter-pills">
									{ [
										{
											id: 'all',
											label: __(
												'All Files',
												'drivevault-for-easy-digital-downloads'
											),
										},
										{
											id: 'docs',
											label: __(
												'Documents',
												'drivevault-for-easy-digital-downloads'
											),
										},
										{
											id: 'archives',
											label: __(
												'Archives',
												'drivevault-for-easy-digital-downloads'
											),
										},
										{
											id: 'media',
											label: __(
												'Media',
												'drivevault-for-easy-digital-downloads'
											),
										},
										{
											id: 'images',
											label: __(
												'Images',
												'drivevault-for-easy-digital-downloads'
											),
										},
									].map( ( cat ) => (
										<button
											key={ cat.id }
											type="button"
											className={ `drivevault-cat-pill ${
												activeCategory === cat.id
													? 'is-active'
													: ''
											}` }
											onClick={ () =>
												setActiveCategory( cat.id )
											}
										>
											{ cat.label }
										</button>
									) ) }
								</div>

								<div className="drivevault-picker-sort-actions">
									<button
										type="button"
										className="drivevault-btn drivevault-btn--xs drivevault-btn--ghost"
										onClick={ handleSelectAllVisible }
										title={ __(
											'Select all visible downloadable files',
											'drivevault-for-easy-digital-downloads'
										) }
									>
										<Icon name="check" size={ 13 } />
										<span>
											{ __(
												'Select All',
												'drivevault-for-easy-digital-downloads'
											) }
										</span>
									</button>

									<select
										className="drivevault-sort-select"
										value={ sortBy }
										onChange={ ( e ) =>
											setSortBy( e.target.value )
										}
										aria-label={ __(
											'Sort files',
											'drivevault-for-easy-digital-downloads'
										) }
									>
										<option value="name_asc">
											{ __(
												'Name (A to Z)',
												'drivevault-for-easy-digital-downloads'
											) }
										</option>
										<option value="name_desc">
											{ __(
												'Name (Z to A)',
												'drivevault-for-easy-digital-downloads'
											) }
										</option>
										<option value="size_desc">
											{ __(
												'Size (Largest)',
												'drivevault-for-easy-digital-downloads'
											) }
										</option>
										<option value="size_asc">
											{ __(
												'Size (Smallest)',
												'drivevault-for-easy-digital-downloads'
											) }
										</option>
									</select>
								</div>
							</div>
						</div>

						{ /* Scrollable File List */ }
						<div className="drivevault-modal-content-area">
							{ isLoading ? (
								<FileListSkeleton rowsCount={ 7 } />
							) : error ? (
								<div className="drivevault-browser-error">
									<Icon
										name="error"
										size={ 32 }
										color="#d63638"
									/>
									<p className="drivevault-error-title">
										{ __(
											'Error loading files',
											'drivevault-for-easy-digital-downloads'
										) }
									</p>
									<p className="drivevault-error-msg">
										{ error }
									</p>
									<button
										type="button"
										className="drivevault-btn drivevault-btn--secondary"
										onClick={ handleRefresh }
										style={ { marginTop: 12 } }
									>
										{ __(
											'Try Again',
											'drivevault-for-easy-digital-downloads'
										) }
									</button>
								</div>
							) : ! displayedFiles ||
							  displayedFiles.length === 0 ? (
								<div className="drivevault-browser-empty">
									<Icon
										name="cloud_off"
										size={ 48 }
										color="#9aa0a6"
									/>
									<p className="drivevault-empty-title">
										{ __(
											'No files or folders found',
											'drivevault-for-easy-digital-downloads'
										) }
									</p>
									<p className="drivevault-empty-desc">
										{ searchQuery
											? __(
													'No items matched your search query.',
													'drivevault-for-easy-digital-downloads'
											  )
											: activeCategory !== 'all'
											? __(
													'No files match this category filter in this folder.',
													'drivevault-for-easy-digital-downloads'
											  )
											: __(
													'This folder is empty.',
													'drivevault-for-easy-digital-downloads'
											  ) }
									</p>
								</div>
							) : (
								<div className="drivevault-browser-container">
									<table className="drivevault-files-table">
										<thead>
											<tr>
												<th className="drivevault-col-check"></th>
												<th className="drivevault-col-icon"></th>
												<th className="drivevault-col-name">
													{ __(
														'Name',
														'drivevault-for-easy-digital-downloads'
													) }
												</th>
												<th className="drivevault-col-type">
													{ __(
														'Type',
														'drivevault-for-easy-digital-downloads'
													) }
												</th>
												<th className="drivevault-col-size">
													{ __(
														'Size',
														'drivevault-for-easy-digital-downloads'
													) }
												</th>
											</tr>
										</thead>
										<tbody>
											{ displayedFiles.map( ( file ) => {
												const isSelected =
													selectedFiles.some(
														( f ) =>
															f.id === file.id &&
															f.provider ===
																file.provider
													);

												return (
													<tr
														key={ `${ file.provider }-${ file.id }` }
														className={
															isSelected
																? 'is-selected'
																: ''
														}
														onClick={ () => {
															if (
																file.is_folder
															) {
																handleFolderClick(
																	file
																);
															} else {
																handleToggleSelect(
																	file
																);
															}
														} }
													>
														<td
															className="drivevault-col-check"
															onClick={ ( e ) =>
																e.stopPropagation()
															}
														>
															<input
																type="checkbox"
																checked={
																	isSelected
																}
																onChange={ () =>
																	handleToggleSelect(
																		file
																	)
																}
																aria-label={ sprintf(
																	/* translators: %s: item name */
																	__(
																		'Select %s',
																		'drivevault-for-easy-digital-downloads'
																	),
																	file.name
																) }
															/>
														</td>
														<td className="drivevault-col-icon">
															<FileIcon
																mimeType={
																	file.mime_type
																}
																isFolder={
																	file.is_folder
																}
																name={
																	file.name
																}
															/>
														</td>
														<td className="drivevault-col-name">
															<span
																className="drivevault-filename"
																title={
																	file.name
																}
															>
																{ file.name }
															</span>
														</td>
														<td className="drivevault-col-type">
															<span className="drivevault-type-badge">
																{ file.is_folder
																	? __(
																			'Folder',
																			'drivevault-for-easy-digital-downloads'
																	  )
																	: (
																			file.name
																				.split(
																					'.'
																				)
																				.pop() ||
																			'File'
																	  ).toUpperCase() }
															</span>
														</td>
														<td className="drivevault-col-size">
															<span className="drivevault-filesize">
																{ file.size_formatted ||
																	'—' }
															</span>
														</td>
													</tr>
												);
											} ) }
										</tbody>
									</table>
								</div>
							) }
						</div>

						{ /* Fixed Bottom Action Footer */ }
						<div className="drivevault-modal-footer">
							<div className="drivevault-modal-footer-left">
								{ selectedFiles.length > 0 ? (
									<div className="drivevault-selection-pill">
										<span className="drivevault-selection-badge">
											{ selectedFiles.length }
										</span>
										<span className="drivevault-selection-label">
											{ totalSelectedSize > 0
												? sprintf(
														/* translators: 1: count, 2: total size */
														__(
															'%1$d file(s) selected (%2$s)',
															'drivevault-for-easy-digital-downloads'
														),
														selectedFiles.length,
														formatBytes(
															totalSelectedSize
														)
												  )
												: sprintf(
														/* translators: %d: count */
														__(
															'%d file(s) selected',
															'drivevault-for-easy-digital-downloads'
														),
														selectedFiles.length
												  ) }
										</span>
										<button
											type="button"
											className="drivevault-selection-clear-btn"
											onClick={ clearSelection }
											title={ __(
												'Clear selection',
												'drivevault-for-easy-digital-downloads'
											) }
										>
											<Icon name="close" size={ 13 } />
											<span>
												{ __(
													'Clear',
													'drivevault-for-easy-digital-downloads'
												) }
											</span>
										</button>
									</div>
								) : (
									<span className="drivevault-no-selection-hint">
										<Icon
											name="info"
											size={ 16 }
											color="#94a3b8"
										/>
										{ __(
											'Click on items to select files for download',
											'drivevault-for-easy-digital-downloads'
										) }
									</span>
								) }
							</div>

							<div className="drivevault-modal-footer-right">
								<button
									type="button"
									className="drivevault-btn drivevault-btn--secondary"
									onClick={ onClose }
								>
									{ __(
										'Cancel',
										'drivevault-for-easy-digital-downloads'
									) }
								</button>

								<button
									type="button"
									className="drivevault-btn drivevault-btn--primary"
									onClick={ handleInsert }
									disabled={ selectedFiles.length === 0 }
								>
									<Icon name="add" size={ 17 } />
									<span>
										{ selectedFiles.length > 0
											? sprintf(
													/* translators: %d: count */
													__(
														'Insert %d File(s)',
														'drivevault-for-easy-digital-downloads'
													),
													selectedFiles.length
											  )
											: __(
													'Insert Selected',
													'drivevault-for-easy-digital-downloads'
											  ) }
									</span>
								</button>
							</div>
						</div>
					</div>
				) }

				{ /* Custom Modern Confirmation Dialog for Unauthorized Providers */ }
				{ showConfirmModal && pendingProvider && (
					<div
						className="drivevault-confirm-dialog-overlay"
						onClick={ () => setShowConfirmModal( false ) }
					>
						<div
							className="drivevault-confirm-dialog-card"
							onClick={ ( e ) => e.stopPropagation() }
						>
							<div className="drivevault-confirm-dialog-header">
								<div
									className="drivevault-confirm-avatar"
									style={ {
										background: pendingProvider.avatarBg,
									} }
								>
									{ pendingProvider.icon }
								</div>
								<div className="drivevault-confirm-header-content">
									<span className="drivevault-confirm-badge">
										{ __(
											'Configuration Required',
											'drivevault-for-easy-digital-downloads'
										) }
									</span>
									<h3>
										{ sprintf(
											/* translators: %s: provider name */
											__(
												'Connect %s Account',
												'drivevault-for-easy-digital-downloads'
											),
											pendingProvider.name
										) }
									</h3>
								</div>
								<button
									type="button"
									className="drivevault-confirm-close-btn"
									onClick={ () =>
										setShowConfirmModal( false )
									}
									aria-label={ __(
										'Close dialog',
										'drivevault-for-easy-digital-downloads'
									) }
								>
									<Icon name="close" size={ 18 } />
								</button>
							</div>

							<div className="drivevault-confirm-dialog-body">
								<p className="drivevault-confirm-desc">
									{ sprintf(
										/* translators: %s: provider name */
										__(
											'%s is not connected or authorized yet. To browse and attach downloadable files, please configure your API credentials and authorize your account.',
											'drivevault-for-easy-digital-downloads'
										),
										pendingProvider.name
									) }
								</p>

								<div className="drivevault-confirm-features">
									<div className="drivevault-confirm-feature-item">
										<Icon
											name="check_circle"
											size={ 16 }
											color="#10b981"
										/>
										<span>
											{ __(
												'Direct cloud delivery without server disk overhead',
												'drivevault-for-easy-digital-downloads'
											) }
										</span>
									</div>
									<div className="drivevault-confirm-feature-item">
										<Icon
											name="check_circle"
											size={ 16 }
											color="#10b981"
										/>
										<span>
											{ __(
												'Signed, time-expiring secure download URLs',
												'drivevault-for-easy-digital-downloads'
											) }
										</span>
									</div>
								</div>
							</div>

							<div className="drivevault-confirm-dialog-footer">
								<button
									type="button"
									className="drivevault-btn drivevault-btn--secondary"
									onClick={ () =>
										setShowConfirmModal( false )
									}
								>
									{ __(
										'Cancel',
										'drivevault-for-easy-digital-downloads'
									) }
								</button>

								<a
									href={ pendingProvider.settingsUrl }
									target="_blank"
									rel="noreferrer"
									className="drivevault-btn drivevault-btn--primary"
									onClick={ () =>
										setShowConfirmModal( false )
									}
								>
									<Icon name="open_in_new" size={ 16 } />
									<span>
										{ sprintf(
											/* translators: %s: provider name */
											__(
												'Configure %s',
												'drivevault-for-easy-digital-downloads'
											),
											pendingProvider.name
										) }
									</span>
								</a>
							</div>
						</div>
					</div>
				) }
			</div>
		</div>
	);
};

export default FilePickerModal;
