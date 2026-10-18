import React, { useState, useEffect, useRef, useCallback } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import Icon from './Icon';

/**
 * Admin Notices Bell with Counter Badge and Floating Dropdown.
 * Captures external WordPress admin notices so they don't break the DriveVault layout.
 */
export const AdminNoticesBell = () => {
	const [ notices, setNotices ] = useState( [] );
	const [ isOpen, setIsOpen ] = useState( false );
	const storageRef = useRef( null );
	const dropdownRef = useRef( null );

	const isCandidateNotice = useCallback( ( el ) => {
		if ( ! el || ! el.nodeType || el.nodeType !== 1 ) {
			return false;
		}

		// Never capture elements belonging to DriveVault's own notices bell or dropdown
		if ( el.closest( '.drivevault-notices-bell-wrapper' ) ) {
			return false;
		}
		if (
			typeof el.className === 'string' &&
			el.className.includes( 'drivevault-notices' )
		) {
			return false;
		}

		// Never capture DriveVault core UI components unless already tagged as a captured notice
		if (
			typeof el.className === 'string' &&
			el.className.includes( 'drivevault-' ) &&
			! el.classList.contains( 'drivevault-captured' )
		) {
			return false;
		}

		// Don't capture hidden or dismissed elements
		if (
			el.style.display === 'none' ||
			el.hidden ||
			el.classList.contains( 'hidden' )
		) {
			return false;
		}

		// Ensure element has meaningful content (text or interactive elements)
		if (
			! el.textContent?.trim() &&
			! el.querySelector( 'img, svg, button, a, form, input' )
		) {
			return false;
		}

		return true;
	}, [] );

	const collectNotices = useCallback( () => {
		const wpbody =
			document.getElementById( 'wpbody-content' ) || document.body;

		// Select broad range of standard and non-standard admin notice selectors
		const candidateSelectors = [
			'#wf-onboarding-banner',
			'[id*="onboarding-banner"]',
			'.notice',
			'.updated',
			'.error',
			'.update-nag',
			'.is-dismissible',
			'.wf-admin-notice',
			'.wfls-persistent-notice',
			'div[class*="notice"]',
		].join( ', ' );

		const candidateNodes = Array.from(
			wpbody.querySelectorAll( candidateSelectors )
		);
		const validNotices = [];

		candidateNodes.forEach( ( el ) => {
			if ( ! isCandidateNotice( el ) ) {
				return;
			}

			// Add isolating classes so common.js doesn't displace the notice
			if ( ! el.classList.contains( 'drivevault-captured' ) ) {
				el.classList.add( 'drivevault-captured' );
			}
			if ( ! el.classList.contains( 'inline' ) ) {
				el.classList.add( 'inline' );
			}

			// Move into our floating dropdown storage if not already there
			if ( storageRef.current && ! storageRef.current.contains( el ) ) {
				storageRef.current.appendChild( el );
			}

			validNotices.push( el );
		} );

		// Also count and verify any previously captured nodes in storageRef
		if ( storageRef.current ) {
			const stored = Array.from( storageRef.current.children );
			stored.forEach( ( child ) => {
				if (
					child.isConnected &&
					child.style.display !== 'none' &&
					! child.hidden &&
					! child.classList.contains( 'hidden' )
				) {
					if ( ! validNotices.includes( child ) ) {
						validNotices.push( child );
					}
				}
			} );
		}

		setNotices( validNotices );
	}, [ isCandidateNotice ] );

	useEffect( () => {
		// Initial collection
		collectNotices();

		const wpbody =
			document.getElementById( 'wpbody-content' ) || document.body;

		// Observe wpbody-content for newly injected or relocated notices
		const bodyObserver = new MutationObserver( () => {
			collectNotices();
		} );

		bodyObserver.observe( wpbody, {
			childList: true,
			subtree: true,
		} );

		// Observe storageRef for notice dismissals (removals or style="display:none")
		let storageObserver;
		if ( storageRef.current ) {
			storageObserver = new MutationObserver( () => {
				collectNotices();
			} );
			storageObserver.observe( storageRef.current, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: [ 'style', 'class' ],
			} );
		}

		// Handle dismiss clicks inside the notices storage
		const handleDismissClick = ( e ) => {
			if (
				e.target.closest(
					'.notice-dismiss, #wf-onboarding-delay, .wf-onboarding-btn, button[class*="dismiss"], a[class*="dismiss"]'
				)
			) {
				setTimeout( collectNotices, 150 );
				setTimeout( collectNotices, 400 );
			}
		};

		const storageNode = storageRef.current;
		if ( storageNode ) {
			storageNode.addEventListener( 'click', handleDismissClick );
		}

		// Periodically collect for the first 4 seconds for slow/async notices
		const timer = setInterval( collectNotices, 600 );
		const timeout = setTimeout( () => clearInterval( timer ), 4000 );

		return () => {
			bodyObserver.disconnect();
			if ( storageObserver ) {
				storageObserver.disconnect();
			}
			if ( storageNode ) {
				storageNode.removeEventListener( 'click', handleDismissClick );
			}
			clearInterval( timer );
			clearTimeout( timeout );
		};
	}, [ collectNotices ] );

	// Auto-close dropdown if notices list becomes empty
	useEffect( () => {
		if ( notices.length === 0 && isOpen ) {
			setIsOpen( false );
		}
	}, [ notices.length, isOpen ] );

	// Handle click outside and Escape key
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

	const count = notices.length;

	return (
		<div
			className="drivevault-notices-bell-wrapper"
			ref={ dropdownRef }
			style={ { display: count > 0 ? 'inline-block' : 'none' } }
		>
			<button
				type="button"
				className={ `drivevault-bell-btn ${
					isOpen ? 'is-active' : ''
				}` }
				onClick={ () => setIsOpen( ! isOpen ) }
				title={ sprintf(
					/* translators: %d: number of admin notices */
					__(
						'%d Admin Notice(s) Available',
						'drivevault-for-easy-digital-download'
					),
					count
				) }
				aria-expanded={ isOpen }
				aria-haspopup="true"
			>
				<Icon name="notifications" size={ 20 } />
				{ count > 0 && (
					<span className="drivevault-bell-badge">{ count }</span>
				) }
			</button>

			{ /* Popup / Dropdown */ }
			<div
				className={ `drivevault-notices-dropdown ${
					isOpen ? 'is-open' : ''
				}` }
				style={ { display: isOpen ? 'block' : 'none' } }
			>
				<div className="drivevault-notices-dropdown-header">
					<div className="drivevault-notices-dropdown-title">
						<Icon
							name="notifications"
							size={ 18 }
							color="#1a73e8"
						/>
						<h4>
							{ __(
								'Admin Notices',
								'drivevault-for-easy-digital-download'
							) }
						</h4>
						<span className="drivevault-notices-dropdown-count">
							{ count }
						</span>
					</div>
					<button
						type="button"
						className="drivevault-notices-close-btn"
						onClick={ () => setIsOpen( false ) }
						aria-label={ __(
							'Close notices',
							'drivevault-for-easy-digital-download'
						) }
					>
						<Icon name="close" size={ 16 } />
					</button>
				</div>

				<div
					className="drivevault-notices-dropdown-body"
					ref={ storageRef }
				/>

				<div className="drivevault-notices-dropdown-footer">
					<span>
						{ __(
							'Notices collected from WordPress and third-party plugins.',
							'drivevault-for-easy-digital-download'
						) }
					</span>
				</div>
			</div>
		</div>
	);
};

export default AdminNoticesBell;
