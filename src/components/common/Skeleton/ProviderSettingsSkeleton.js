import React from 'react';
import Skeleton from './Skeleton';

/**
 * Modern Skeleton layout for Cloud Provider Settings tabs.
 */
export const ProviderSettingsSkeleton = ( { fieldsCount = 3 } ) => {
	const fields = Array.from( { length: fieldsCount } );

	return (
		<div className="drivevault-provider-skeleton-wrap" aria-busy="true">
			{ /* Connection Status Banner Skeleton */ }
			<div className="drivevault-ui-card drivevault-skeleton-card drivevault-skeleton-banner">
				<div className="drivevault-skeleton-banner-left">
					<Skeleton
						variant="rect"
						width={ 44 }
						height={ 44 }
						borderRadius={ 10 }
						className="drivevault-skeleton-icon"
					/>
					<div className="drivevault-skeleton-banner-text">
						<Skeleton
							variant="text"
							width="220px"
							height={ 20 }
							style={ { marginBottom: 8 } }
						/>
						<Skeleton variant="text" width="380px" height={ 14 } />
					</div>
				</div>
				<div className="drivevault-skeleton-banner-right">
					<Skeleton
						variant="pill"
						width={ 140 }
						height={ 38 }
						borderRadius={ 8 }
					/>
				</div>
			</div>

			{ /* Configuration Form Card Skeleton */ }
			<div className="drivevault-ui-card drivevault-skeleton-card drivevault-skeleton-form">
				<div className="drivevault-skeleton-header">
					<Skeleton
						variant="text"
						width="260px"
						height={ 22 }
						style={ { marginBottom: 8 } }
					/>
					<Skeleton
						variant="text"
						width="480px"
						height={ 14 }
						style={ { marginBottom: 28 } }
					/>
				</div>

				<div className="drivevault-skeleton-fields">
					{ fields.map( ( _, idx ) => (
						<div
							key={ idx }
							className="drivevault-skeleton-field-group"
						>
							<Skeleton
								variant="text"
								width={ 130 + ( idx % 2 ) * 40 }
								height={ 14 }
								style={ { marginBottom: 8 } }
							/>
							<Skeleton
								variant="rect"
								height={ 40 }
								borderRadius={ 6 }
								style={ { marginBottom: 8 } }
							/>
							<Skeleton
								variant="text"
								width="320px"
								height={ 12 }
								style={ { marginBottom: 24 } }
							/>
						</div>
					) ) }
				</div>

				<div className="drivevault-skeleton-actions">
					<Skeleton
						variant="rect"
						width={ 160 }
						height={ 40 }
						borderRadius={ 6 }
					/>
				</div>
			</div>
		</div>
	);
};

export default ProviderSettingsSkeleton;
