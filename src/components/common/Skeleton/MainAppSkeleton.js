import React from 'react';
import Skeleton from './Skeleton';
import ProviderSettingsSkeleton from './ProviderSettingsSkeleton';

/**
 * Modern Skeleton layout for entire DriveVault Admin App initial bootstrap.
 */
export const MainAppSkeleton = () => {
	return (
		<div className="drivevault-main-app-skeleton" aria-busy="true">
			{ /* Header Placeholder */ }
			<div className="drivevault-skeleton-app-header">
				<div
					style={ { display: 'flex', alignItems: 'center', gap: 14 } }
				>
					<Skeleton
						variant="rect"
						width={ 48 }
						height={ 48 }
						borderRadius={ 12 }
					/>
					<div>
						<Skeleton
							variant="text"
							width={ 300 }
							height={ 24 }
							style={ { marginBottom: 6 } }
						/>
						<Skeleton variant="text" width={ 420 } height={ 14 } />
					</div>
				</div>
				<Skeleton
					variant="pill"
					width={ 160 }
					height={ 40 }
					borderRadius={ 20 }
				/>
			</div>

			{ /* Main Navigation Tabs Placeholder */ }
			<div className="drivevault-skeleton-tabs-bar">
				{ [ 140, 150, 130, 160 ].map( ( w, idx ) => (
					<Skeleton
						key={ idx }
						variant="rect"
						width={ w }
						height={ 38 }
						borderRadius={ 8 }
					/>
				) ) }
			</div>

			{ /* Provider Sub-Tabs Placeholder */ }
			<div className="drivevault-skeleton-subtabs-bar">
				{ [ 130, 110, 140, 115 ].map( ( w, idx ) => (
					<Skeleton
						key={ idx }
						variant="pill"
						width={ w }
						height={ 34 }
						borderRadius={ 17 }
					/>
				) ) }
			</div>

			{ /* Body Content Skeleton */ }
			<div className="drivevault-skeleton-body">
				<ProviderSettingsSkeleton fieldsCount={ 3 } />
			</div>
		</div>
	);
};

export default MainAppSkeleton;
