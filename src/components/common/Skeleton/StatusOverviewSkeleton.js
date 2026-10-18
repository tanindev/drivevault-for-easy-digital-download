import React from 'react';
import Skeleton from './Skeleton';

/**
 * Modern Skeleton layout for Quota & System Status tab.
 */
export const StatusOverviewSkeleton = () => {
	return (
		<div className="drivevault-status-skeleton-wrap" aria-busy="true">
			{ /* Main Storage Quota Card Skeleton */ }
			<div className="drivevault-ui-card drivevault-skeleton-card drivevault-status-quota-card">
				<div className="drivevault-status-card-header">
					<div
						style={ {
							display: 'flex',
							alignItems: 'center',
							gap: 12,
						} }
					>
						<Skeleton
							variant="rect"
							width={ 36 }
							height={ 36 }
							borderRadius={ 8 }
						/>
						<div>
							<Skeleton
								variant="text"
								width={ 220 }
								height={ 20 }
								style={ { marginBottom: 6 } }
							/>
							<Skeleton
								variant="text"
								width={ 260 }
								height={ 13 }
							/>
						</div>
					</div>
					<Skeleton
						variant="rect"
						width={ 110 }
						height={ 34 }
						borderRadius={ 6 }
					/>
				</div>

				{ /* Large Progress Bar */ }
				<div style={ { margin: '24px 0' } }>
					<Skeleton
						variant="rect"
						height={ 14 }
						borderRadius={ 7 }
						style={ { width: '100%' } }
					/>
				</div>

				{ /* Stat metric boxes */ }
				<div className="drivevault-status-metrics-grid">
					{ [ 1, 2, 3 ].map( ( idx ) => (
						<div
							key={ idx }
							className="drivevault-status-metric-box drivevault-skeleton-metric"
						>
							<Skeleton
								variant="text"
								width={ 80 }
								height={ 12 }
								style={ { marginBottom: 8 } }
							/>
							<Skeleton
								variant="text"
								width={ 110 }
								height={ 24 }
							/>
						</div>
					) ) }
				</div>
			</div>

			{ /* Provider Cards Skeleton Grid */ }
			<div className="drivevault-status-providers-grid">
				{ [ 1, 2, 3 ].map( ( idx ) => (
					<div
						key={ idx }
						className="drivevault-ui-card drivevault-skeleton-card drivevault-status-provider-card"
					>
						<div className="drivevault-status-card-header">
							<div
								style={ {
									display: 'flex',
									alignItems: 'center',
									gap: 12,
								} }
							>
								<Skeleton
									variant="rect"
									width={ 32 }
									height={ 32 }
									borderRadius={ 8 }
								/>
								<div>
									<Skeleton
										variant="text"
										width={ 140 }
										height={ 18 }
										style={ { marginBottom: 4 } }
									/>
									<Skeleton
										variant="text"
										width={ 90 }
										height={ 12 }
									/>
								</div>
							</div>
							<Skeleton
								variant="pill"
								width={ 70 }
								height={ 22 }
								borderRadius={ 11 }
							/>
						</div>
						<div style={ { margin: '20px 0' } }>
							<Skeleton
								variant="text"
								width="90%"
								height={ 14 }
								style={ { marginBottom: 6 } }
							/>
							<Skeleton
								variant="text"
								width="60%"
								height={ 14 }
							/>
						</div>
						<div
							style={ {
								display: 'flex',
								justifyContent: 'flex-end',
								paddingTop: 12,
								borderTop: '1px solid #f1f5f9',
							} }
						>
							<Skeleton
								variant="rect"
								width={ 120 }
								height={ 32 }
								borderRadius={ 6 }
							/>
						</div>
					</div>
				) ) }
			</div>

			{ /* System Environment Check Skeleton */ }
			<div className="drivevault-ui-card drivevault-skeleton-card drivevault-status-env-card">
				<div className="drivevault-status-card-header">
					<div>
						<Skeleton
							variant="text"
							width={ 200 }
							height={ 20 }
							style={ { marginBottom: 6 } }
						/>
						<Skeleton variant="text" width={ 320 } height={ 13 } />
					</div>
				</div>
				<div style={ { marginTop: 16 } }>
					{ [ 1, 2, 3, 4, 5 ].map( ( idx ) => (
						<div
							key={ idx }
							style={ {
								display: 'flex',
								justifyContent: 'space-between',
								padding: '12px 0',
								borderBottom: '1px solid #f8fafc',
							} }
						>
							<Skeleton
								variant="text"
								width={ 150 }
								height={ 14 }
							/>
							<Skeleton
								variant="text"
								width={ 90 }
								height={ 14 }
							/>
						</div>
					) ) }
				</div>
			</div>
		</div>
	);
};

export default StatusOverviewSkeleton;
