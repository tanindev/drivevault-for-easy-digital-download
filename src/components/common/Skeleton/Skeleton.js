import React from 'react';

/**
 * Base Skeleton placeholder component with shimmer animation.
 *
 * @param {Object} props
 * @param {string} [props.className] Optional CSS class names.
 * @param {string|number} [props.width] Width in CSS units or px.
 * @param {string|number} [props.height] Height in CSS units or px.
 * @param {'rect'|'circle'|'text'|'pill'} [props.variant='rect'] Shape variant.
 * @param {string|number} [props.borderRadius] Custom border radius.
 * @param {Object} [props.style] Additional inline styles.
 */
export const Skeleton = ( {
	className = '',
	width,
	height,
	variant = 'rect',
	borderRadius,
	style = {},
	...rest
} ) => {
	const inlineStyles = {
		...style,
	};

	if ( width !== undefined ) {
		inlineStyles.width = typeof width === 'number' ? `${ width }px` : width;
	}

	if ( height !== undefined ) {
		inlineStyles.height =
			typeof height === 'number' ? `${ height }px` : height;
	}

	if ( borderRadius !== undefined ) {
		inlineStyles.borderRadius =
			typeof borderRadius === 'number'
				? `${ borderRadius }px`
				: borderRadius;
	}

	const variantClass = `variant-${ variant }`;

	return (
		<div
			className={ `drivevault-skeleton ${ variantClass } ${ className }` }
			style={ inlineStyles }
			aria-hidden="true"
			{ ...rest }
		/>
	);
};

export default Skeleton;
