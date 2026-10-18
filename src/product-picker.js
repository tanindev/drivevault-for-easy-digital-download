import React, { useState, useEffect } from 'react';
import { render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import store from './store'; // Initialize @wordpress/data store
import FilePickerModal from './components/FilePickerModal';
import './scss/icons.scss';
import './scss/picker.scss';

const DRIVEVAULT_SVG_ICON = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; display: inline-block; flex-shrink: 0;" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z"/>
</svg>
`;

const checkedUrls = new Map();

const renderStatusPill = ( container, data ) => {
	if ( data.status === 'healthy' ) {
		const sizeText = data.formatted_size
			? ` (${ data.formatted_size })`
			: '';
		const previewHtml = data.web_view_link
			? `<a href="${
					data.web_view_link
			  }" target="_blank" rel="noreferrer" class="drivevault-row-preview-link" title="${ __(
					'Preview file in Google Drive',
					'drivevault-for-easy-digital-download'
			  ) }">Preview ↗</a>`
			: '';
		container.innerHTML = `
			<span class="drivevault-row-pill drivevault-row-pill--healthy">
				<span class="drivevault-row-pill-dot"></span>
				<span>${ __(
					'Verified',
					'drivevault-for-easy-digital-download'
				) }${ sizeText }</span>
			</span>
			${ previewHtml }
		`;
	} else if ( data.status === 'missing' ) {
		container.innerHTML = `
			<span class="drivevault-row-pill drivevault-row-pill--broken" title="${
				data.message ||
				__(
					'File not found on Google Drive',
					'drivevault-for-easy-digital-download'
				)
			}">
				<span class="drivevault-row-pill-dot"></span>
				<span>${ __(
					'Missing / Deleted',
					'drivevault-for-easy-digital-download'
				) }</span>
			</span>
		`;
	} else if ( data.status === 'unauthorized' ) {
		container.innerHTML = `
			<span class="drivevault-row-pill drivevault-row-pill--warning" title="${
				data.message ||
				__(
					'Permission denied',
					'drivevault-for-easy-digital-download'
				)
			}">
				<span class="drivevault-row-pill-dot"></span>
				<span>${ __( 'Access Denied', 'drivevault-for-easy-digital-download' ) }</span>
			</span>
		`;
	} else if ( data.status === 'checking' ) {
		container.innerHTML = `
			<span class="drivevault-row-pill drivevault-row-pill--checking">
				<span class="drivevault-row-pill-spinner"></span>
				<span>${ __(
					'Checking link...',
					'drivevault-for-easy-digital-download'
				) }</span>
			</span>
		`;
	} else {
		container.innerHTML = `
			<span class="drivevault-row-pill drivevault-row-pill--cloud">
				<span class="drivevault-row-pill-dot"></span>
				<span>${ __( 'Cloud File', 'drivevault-for-easy-digital-download' ) }</span>
			</span>
		`;
	}
};

const decorateFileRows = () => {
	const fileInputs = document.querySelectorAll(
		'.downloadable_files input[name*="file_url"], .downloadable_files .file_url input[type="text"], #general_product_data .file_url input[type="text"], input[name*="_file_urls"], .edd_repeatable_upload_field, input[name*="edd_download_files"][name*="[file]"]'
	);

	fileInputs.forEach( ( input ) => {
		const rawVal = ( input.value || '' ).trim();
		const row =
			input.closest( 'tr' ) ||
			input.closest( '.edd_repeatable_upload_wrapper' ) ||
			input.closest( '.edd_repeatable_row' );
		if ( ! row ) return;

		let container = input.parentNode.querySelector(
			'.drivevault-row-badge-container'
		);

		if (
			! rawVal ||
			( ! rawVal.startsWith( 'gdrive://' ) &&
				! rawVal.startsWith( 'googledrive://' ) &&
				! rawVal.startsWith( 'dropbox://' ) &&
				! rawVal.startsWith( 'onedrive://' ) &&
				! rawVal.startsWith( 's3://' ) &&
				! rawVal.includes( 'drive.google.com' ) )
		) {
			if ( container ) container.remove();
			return;
		}

		if ( ! container ) {
			container = document.createElement( 'div' );
			container.className = 'drivevault-row-badge-container';
			input.parentNode.appendChild( container );
		}

		if ( checkedUrls.has( rawVal ) ) {
			renderStatusPill( container, checkedUrls.get( rawVal ) );
			return;
		}

		renderStatusPill( container, { status: 'checking' } );

		apiFetch( {
			path: 'drivevault-edd/v1/tools/verify-file',
			method: 'POST',
			data: { file_url: rawVal },
		} )
			.then( ( data ) => {
				checkedUrls.set( rawVal, data );
				renderStatusPill( container, data );
			} )
			.catch( () => {
				const fallback = { status: 'cloud' };
				checkedUrls.set( rawVal, fallback );
				renderStatusPill( container, fallback );
			} );
	} );
};

const ProductPickerApp = () => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ targetContext, setTargetContext ] = useState( {
		type: 'simple',
		loop: null,
		buttonEl: null,
	} );

	useEffect( () => {
		// Injects single unified "Add DriveVault File" button right next to WooCommerce's "Add File" button or EDD's "Add File" button
		const injectButtons = () => {
			// 1. Simple product table (WooCommerce)
			const simpleTables = document.querySelectorAll(
				'.downloadable_files table, #general_product_data table.widefat'
			);
			simpleTables.forEach( ( table ) => {
				const insertBtn = table.querySelector(
					'a.insert, button.insert'
				);
				if (
					insertBtn &&
					! insertBtn.parentNode.querySelector(
						'.drivevault-open-picker-btn'
					)
				) {
					const buttonLabel =
						window.drivevaultData?.i18n?.addDriveVaultFile ||
						__(
							'Add DriveVault File',
							'drivevault-for-easy-digital-download'
						);
					const btn = document.createElement( 'button' );
					btn.type = 'button';
					btn.className =
						'button drivevault-open-picker-btn drivevault-cloud-btn';
					btn.setAttribute( 'data-target', 'simple' );
					btn.innerHTML = `${ DRIVEVAULT_SVG_ICON } <span>${ buttonLabel }</span>`;
					btn.style.marginLeft = '8px';
					insertBtn.parentNode.insertBefore(
						btn,
						insertBtn.nextSibling
					);
				}
			} );

			// 2. Variable product variations tables (WooCommerce)
			const variationTables = document.querySelectorAll(
				'.woocommerce_variation .downloadable_files table, .woocommerce_variation table'
			);
			variationTables.forEach( ( table ) => {
				const insertBtn = table.querySelector(
					'a.insert, button.insert'
				);
				const variationWrapper = table.closest(
					'.woocommerce_variation'
				);
				const loop = variationWrapper
					? variationWrapper.getAttribute( 'rel' )
					: null;

				if (
					insertBtn &&
					! insertBtn.parentNode.querySelector(
						'.drivevault-open-picker-btn'
					)
				) {
					const buttonLabel =
						window.drivevaultData?.i18n?.addDriveVaultFile ||
						__(
							'Add DriveVault File',
							'drivevault-for-easy-digital-download'
						);
					const btn = document.createElement( 'button' );
					btn.type = 'button';
					btn.className =
						'button drivevault-open-picker-btn drivevault-cloud-btn';
					btn.setAttribute( 'data-target', 'variation' );
					if ( loop !== null ) {
						btn.setAttribute( 'data-loop', loop );
					}
					btn.innerHTML = `${ DRIVEVAULT_SVG_ICON } <span>${ buttonLabel }</span>`;
					btn.style.marginLeft = '8px';
					insertBtn.parentNode.insertBefore(
						btn,
						insertBtn.nextSibling
					);
				}
			} );

			// 3. Easy Digital Downloads Download Files Metabox
			const eddWrap = document.querySelector(
				'#edd_download_files .edd-add-repeatable-row, #edd_download_files'
			);
			if ( eddWrap ) {
				const eddAddBtn = eddWrap.querySelector(
					'.edd_add_repeatable'
				);
				if (
					eddAddBtn &&
					! eddAddBtn.parentNode.querySelector(
						'.drivevault-open-picker-btn'
					)
				) {
					const buttonLabel =
						window.drivevaultData?.i18n?.addDriveVaultFile ||
						__(
							'Add DriveVault File',
							'drivevault-for-easy-digital-download'
						);
					const btn = document.createElement( 'button' );
					btn.type = 'button';
					btn.className =
						'button drivevault-open-picker-btn drivevault-cloud-btn';
					btn.setAttribute( 'data-target', 'edd' );
					btn.innerHTML = `${ DRIVEVAULT_SVG_ICON } <span>${ buttonLabel }</span>`;
					btn.style.marginLeft = '8px';
					eddAddBtn.parentNode.insertBefore(
						btn,
						eddAddBtn.nextSibling
					);
				}
			}
		};

		const refreshDOM = () => {
			injectButtons();
			decorateFileRows();
		};

		refreshDOM();

		// Listen for variations loaded or added in WooCommerce
		if ( window.jQuery ) {
			window
				.jQuery( document )
				.on(
					'woocommerce_variations_loaded woocommerce_variations_added woocommerce_variations_saved edd_file_added',
					refreshDOM
				);
		}

		// Interval to ensure buttons and badges are present after tab switches or dynamic loads
		const interval = setInterval( refreshDOM, 1000 );

		// Click handler for picker buttons
		const handlePickerButtonClick = ( e ) => {
			const btn = e.target.closest( '.drivevault-open-picker-btn' );
			if ( ! btn ) return;
			e.preventDefault();
			e.stopPropagation();

			const type = btn.getAttribute( 'data-target' ) || 'simple';
			const loop = btn.getAttribute( 'data-loop' ) || null;

			setTargetContext( { type, loop, buttonEl: btn } );
			setIsOpen( true );
		};

		document.addEventListener( 'click', handlePickerButtonClick );

		return () => {
			clearInterval( interval );
			document.removeEventListener( 'click', handlePickerButtonClick );
		};
	}, [] );

	const handleInsertFiles = ( files ) => {
		if ( ! files || ! files.length ) return;

		const $ = window.jQuery;
		if ( ! $ ) {
			alert(
				__(
					'jQuery is required to insert downloadable files.',
					'drivevault-for-easy-digital-download'
				)
			);
			return;
		}

		// Helper to format cloud URL
		const formatCloudUrl = ( file ) => {
			let fileUrl = file.download_url;
			if ( fileUrl ) {
				return fileUrl.replace(
					/^(dropbox|onedrive|s3|gdrive):\/\/(?!file\/)/,
					'$1://file/'
				);
			}
			if ( file.provider === 'dropbox' ) {
				const cleanPath = (
					file.path ||
					file.path_display ||
					file.id ||
					''
				).replace( /^\/+/, '' );
				return `dropbox://file/${ cleanPath }`;
			}
			if ( file.provider === 'onedrive' ) {
				return `onedrive://file/${ file.id }`;
			}
			if ( file.provider === 's3' ) {
				const b =
					file.bucket || window.drivevaultData?.amazonBucket || '';
				const cleanKey = ( file.key || file.id || '' ).replace(
					/^\/+/,
					''
				);
				return b
					? `s3://file/${ b }/${ cleanKey }`
					: `s3://file/${ cleanKey }`;
			}
			return `gdrive://file/${ file.id }`;
		};

		// 1. EDD Download post handling
		const $eddContainer = $( '#edd_download_files' );
		if (
			$eddContainer.length &&
			( targetContext.type === 'edd' ||
				! $( '.downloadable_files table' ).length )
		) {
			files.forEach( ( file ) => {
				const fileName =
					file.name ||
					__(
						'Cloud Storage File',
						'drivevault-for-easy-digital-download'
					);
				const fileUrl = formatCloudUrl( file );

				let $emptyRow = null;
				$eddContainer
					.find( '.edd_repeatable_upload_wrapper' )
					.each( function () {
						const $r = $( this );
						const fileVal = $r
							.find( '.edd_repeatable_upload_field' )
							.val();
						const nameVal = $r
							.find( '.edd_repeatable_name_field' )
							.val();
						if (
							( ! fileVal || fileVal === '' ) &&
							( ! nameVal || nameVal === '' ) &&
							! $emptyRow
						) {
							$emptyRow = $r;
						}
					} );

				if ( $emptyRow && $emptyRow.length ) {
					$emptyRow
						.find( '.edd_repeatable_name_field' )
						.val( fileName )
						.trigger( 'input' )
						.trigger( 'change' );
					$emptyRow
						.find( '.edd_repeatable_upload_field' )
						.val( fileUrl )
						.trigger( 'input' )
						.trigger( 'change' );
				} else {
					const $addBtn = $eddContainer.find( '.edd_add_repeatable' );
					if ( $addBtn.length ) {
						$addBtn.trigger( 'click' );
						const $newRow = $eddContainer.find(
							'.edd_repeatable_upload_wrapper:last'
						);
						$newRow
							.find( '.edd_repeatable_name_field' )
							.val( fileName )
							.trigger( 'input' )
							.trigger( 'change' );
						$newRow
							.find( '.edd_repeatable_upload_field' )
							.val( fileUrl )
							.trigger( 'input' )
							.trigger( 'change' );
					}
				}
			} );
			setTimeout( decorateFileRows, 200 );
			return;
		}

		// 2. WooCommerce locate table from button
		let $table;
		if ( targetContext.buttonEl ) {
			$table = $( targetContext.buttonEl ).closest( 'table' );
		}

		if ( ! $table || ! $table.length ) {
			if (
				targetContext.type === 'variation' &&
				targetContext.loop !== null
			) {
				$table = $(
					`.woocommerce_variation[rel="${ targetContext.loop }"] .downloadable_files table, #variable_product_options .woocommerce_variation:eq(${ targetContext.loop }) .downloadable_files table`
				);
			} else {
				$table = $(
					'.downloadable_files table, #general_product_data .downloadable_files table, #general_product_data table.widefat'
				);
			}
		}

		if ( ! $table || ! $table.length ) {
			$table = $( '.downloadable_files table, table.widefat' ).first();
		}

		const $tbody = $table.find( 'tbody' );
		const $insertButton = $table.find( 'a.insert, button.insert' );
		const rowTemplate =
			$insertButton.attr( 'data-row' ) || $insertButton.data( 'row' );

		files.forEach( ( file ) => {
			const fileName =
				file.name ||
				__(
					'Cloud Storage File',
					'drivevault-for-easy-digital-download'
				);
			const fileUrl = formatCloudUrl( file );

			// Check if there is an existing empty row in the table
			let $emptyRow = null;
			$tbody.find( 'tr' ).each( function () {
				const $r = $( this );
				const nameVal = $r
					.find(
						'input[name*="file_name"], .file_name input[type="text"]'
					)
					.val();
				const urlVal = $r
					.find(
						'input[name*="file_url"], .file_url input[type="text"]'
					)
					.val();
				if (
					( nameVal === '' || nameVal === undefined ) &&
					( urlVal === '' || urlVal === undefined ) &&
					! $emptyRow
				) {
					$emptyRow = $r;
				}
			} );

			if ( $emptyRow && $emptyRow.length ) {
				// Fill existing empty row
				const $nameInp = $emptyRow.find(
					'input[name*="file_name"], .file_name input[type="text"]'
				);
				const $urlInp = $emptyRow.find(
					'input[name*="file_url"], .file_url input[type="text"]'
				);
				$nameInp.val( fileName ).trigger( 'input' ).trigger( 'change' );
				$urlInp.val( fileUrl ).trigger( 'input' ).trigger( 'change' );
			} else if ( rowTemplate ) {
				// Instantiate and populate row directly from WooCommerce template
				const $row = $( rowTemplate );
				$row.find(
					'input[name*="file_name"], .file_name input[type="text"], input[name*="_file_names"]'
				).val( fileName );
				$row.find(
					'input[name*="file_url"], .file_url input[type="text"], input[name*="_file_urls"]'
				).val( fileUrl );
				$tbody.append( $row );
				$row.find( ':input' ).trigger( 'input' ).trigger( 'change' );
			} else if ( $insertButton.length ) {
				// Fallback to triggering native button click
				$insertButton.trigger( 'click' );
				const $newRow = $tbody.find( 'tr:last' );
				$newRow
					.find(
						'input[name*="file_name"], .file_name input[type="text"]'
					)
					.val( fileName )
					.trigger( 'input' )
					.trigger( 'change' );
				$newRow
					.find(
						'input[name*="file_url"], .file_url input[type="text"]'
					)
					.val( fileUrl )
					.trigger( 'input' )
					.trigger( 'change' );
			}
		} );

		$( document.body ).trigger( 'woocommerce_variations_saved' );
		setTimeout( decorateFileRows, 150 );
	};

	return (
		<FilePickerModal
			isOpen={ isOpen }
			onClose={ () => setIsOpen( false ) }
			onInsertFiles={ handleInsertFiles }
		/>
	);
};

// Mount to DOM in admin footer (supports WooCommerce product edit or EDD download edit)
const mountRoot =
	document.getElementById( 'drivevault-product-picker-modal-root' ) ||
	document.getElementById( 'drivevault-edd-picker-modal-root' );
if ( mountRoot ) {
	render( <ProductPickerApp />, mountRoot );
}
