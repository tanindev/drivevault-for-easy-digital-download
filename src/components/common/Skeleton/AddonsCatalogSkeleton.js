import React from 'react';
import Skeleton from './Skeleton';

/**
 * Modern Skeleton layout for Add-ons & Extensions Catalog.
 */
export const AddonsCatalogSkeleton = ( { count = 6 } ) => {
	const cards = Array.from( { length: count } );

	return (
		<div className="drivevault-addons-skeleton-wrap" aria-busy="true">
			{ /* Search and Filters Placeholder */ }
			<div className="drivevault-addons-skeleton-toolbar">
				<Skeleton
					variant="rect"
					width={ 320 }
					height={ 38 }
					borderRadius={ 8 }
				/>
				<div className="drivevault-addons-skeleton-pills">
					{ [ 100, 90, 110, 105, 95 ].map( ( w, idx ) => (
						<Skeleton
							key={ idx }
							variant="pill"
							width={ w }
							height={ 32 }
							borderRadius={ 16 }
						/>
					) ) }
				</div>
			</div>

			{ /* Cards Grid Placeholder */ }
			<div className="drivevault-addons-grid">
				{ cards.map( ( _, idx ) => (
					<div
						key={ idx }
						className="drivevault-addon-card drivevault-skeleton-addon-card"
					>
						{ /* Card Top Header */ }
						<div className="drivevault-skeleton-addon-top">
							<Skeleton
								variant="pill"
								width={ 50 }
								height={ 20 }
								borderRadius={ 10 }
							/>
							<Skeleton
								variant="pill"
								width={ 65 }
								height={ 20 }
								borderRadius={ 10 }
							/>
						</div>

						{ /* Card Title & Icon */ }
						<div className="drivevault-skeleton-addon-main">
							<Skeleton
								variant="rect"
								width={ 42 }
								height={ 42 }
								borderRadius={ 8 }
							/>
							<div className="drivevault-skeleton-addon-titles">
								<Skeleton
									variant="text"
									width="75%"
									height={ 18 }
									style={ { marginBottom: 6 } }
								/>
								<Skeleton
									variant="pill"
									width={ 55 }
									height={ 16 }
									borderRadius={ 8 }
								/>
							</div>
						</div>

						{ /* Description lines */ }
						<div className="drivevault-skeleton-addon-desc">
							<Skeleton
								variant="text"
								width="100%"
								height={ 13 }
								style={ { marginBottom: 6 } }
							/>
							<Skeleton
								variant="text"
								width="85%"
								height={ 13 }
							/>
						</div>

						{ /* Feature tag pills */ }
						<div className="drivevault-skeleton-addon-tags">
							<Skeleton
								variant="pill"
								width={ 90 }
								height={ 22 }
								borderRadius={ 6 }
							/>
							<Skeleton
								variant="pill"
								width={ 110 }
								height={ 22 }
								borderRadius={ 6 }
							/>
							<Skeleton
								variant="pill"
								width={ 80 }
								height={ 22 }
								borderRadius={ 6 }
							/>
						</div>

						{ /* Footer */ }
						<div className="drivevault-skeleton-addon-footer">
							<Skeleton
								variant="pill"
								width={ 70 }
								height={ 24 }
								borderRadius={ 12 }
							/>
							<Skeleton
								variant="rect"
								width={ 95 }
								height={ 32 }
								borderRadius={ 6 }
							/>
						</div>
					</div>
				) ) }
			</div>
		</div>
	);
};

export default AddonsCatalogSkeleton;
