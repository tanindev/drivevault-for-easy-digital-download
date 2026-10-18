import React from 'react';
import { __ } from '@wordpress/i18n';
import Icon from './Icon';

export const PROVIDER_NAMES = {
	gdrive: __( 'Google Drive', 'drivevault-for-easy-digital-download' ),
	google: __( 'Google Drive', 'drivevault-for-easy-digital-download' ),
	dropbox: __( 'Dropbox', 'drivevault-for-easy-digital-download' ),
	onedrive: __( 'OneDrive', 'drivevault-for-easy-digital-download' ),
	s3: __( 'Amazon S3', 'drivevault-for-easy-digital-download' ),
	amazon: __( 'Amazon S3', 'drivevault-for-easy-digital-download' ),
};

/**
 * Universal Brand Provider Icon Badge Component.
 *
 * @param {Object} props
 * @param {string} props.provider Provider slug (e.g. 'gdrive', 'google', 'dropbox', 'onedrive', 's3', 'amazon')
 * @param {number} [props.size=18] Size of inner SVG in pixels.
 * @param {string} [props.className=''] Additional CSS classes.
 */
export const ProviderIcon = ( { provider, size = 18, className = '' } ) => {
	const key = String( provider || '' ).toLowerCase();
	const providerName =
		PROVIDER_NAMES[ key ] ||
		provider ||
		__( 'Cloud Storage', 'drivevault-for-easy-digital-download' );

	let iconSvg = null;
	let badgeClass = 'drivevault-provider-icon-badge--default';

	if ( key === 'gdrive' || key === 'google' ) {
		badgeClass = 'drivevault-provider-icon-badge--gdrive';
		iconSvg = (
			<svg
				width={ size }
				height={ size }
				viewBox="0 0 87.3 78"
				aria-hidden="true"
			>
				<path
					d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5l5.4 9.35z"
					fill="#0066DA"
				/>
				<path
					d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5L43.65 25z"
					fill="#00AC47"
				/>
				<path
					d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.95 10.3 7.8 13.5z"
					fill="#EA4335"
				/>
				<path
					d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.4-4.5 1.2L43.65 25z"
					fill="#00832D"
				/>
				<path
					d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.4 4.5-1.2L59.8 53z"
					fill="#2684FC"
				/>
				<path
					d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5l-12.7-22z"
					fill="#FFBA00"
				/>
			</svg>
		);
	} else if ( key === 'dropbox' ) {
		badgeClass = 'drivevault-provider-icon-badge--dropbox';
		iconSvg = (
			<svg
				width={ size }
				height={ size }
				viewBox="0 0 24 24"
				fill="#0061ff"
				aria-hidden="true"
			>
				<path d="M6 2l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zm12 0l6 4-6 4 6 4-6 4-6-4 6-4-6-4 6-4zm-6 12l6 4-6 4-6-4 6-4z" />
			</svg>
		);
	} else if ( key === 'onedrive' ) {
		badgeClass = 'drivevault-provider-icon-badge--onedrive';
		iconSvg = (
			<svg
				width={ size }
				height={ size }
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<path
					d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-2.45 0-4.64 1.18-6.04 3C2.51 7.42 0 9.94 0 13c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
					fill="#0078D4"
				/>
				<circle
					cx="13"
					cy="12"
					r="3"
					fill="#ffffff"
					fillOpacity="0.4"
				/>
			</svg>
		);
	} else if ( key === 's3' || key === 'amazon' ) {
		badgeClass = 'drivevault-provider-icon-badge--s3';
		iconSvg = (
			<svg
				width={ size }
				height={ size }
				viewBox="0 0 24 24"
				fill="none"
				aria-hidden="true"
			>
				<path
					d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
					fill="#FF9900"
				/>
			</svg>
		);
	} else {
		iconSvg = <Icon name="cloud_queue" size={ size } color="#64748b" />;
	}

	return (
		<span
			className={ `drivevault-provider-icon-badge ${ badgeClass } ${ className }` }
			title={ providerName }
			aria-label={ providerName }
		>
			{ iconSvg }
		</span>
	);
};

export default ProviderIcon;
