import React from 'react';
import Skeleton from './Skeleton';

/**
 * Modern Table Skeleton preloader for Activity Logs.
 *
 * @param {Object} props
 * @param {number} [props.rowsCount=6] Number of skeleton rows to render.
 * @param {boolean} [props.showProviderColumn=true] Whether to show the provider column.
 */
export const LogsTableSkeleton = ( {
	rowsCount = 6,
	showProviderColumn = true,
} ) => {
	const rows = Array.from( { length: rowsCount } );

	return (
		<div className="drivevault-logs-skeleton" aria-busy="true">
			<table className="drivevault-modern-table drivevault-skeleton-table">
				<thead>
					<tr>
						<th style={ { width: '150px' } }>
							<Skeleton
								variant="text"
								width={ 90 }
								height={ 13 }
							/>
						</th>
						<th style={ { width: '80px' } }>
							<Skeleton
								variant="text"
								width={ 50 }
								height={ 13 }
							/>
						</th>
						<th>
							<Skeleton
								variant="text"
								width={ 110 }
								height={ 13 }
							/>
						</th>
						{ showProviderColumn && (
							<th
								style={ {
									width: '80px',
									textAlign: 'center',
								} }
							>
								<Skeleton
									variant="text"
									width={ 50 }
									height={ 13 }
									style={ { margin: '0 auto' } }
								/>
							</th>
						) }
						<th style={ { width: '190px' } }>
							<Skeleton
								variant="text"
								width={ 80 }
								height={ 13 }
							/>
						</th>
						<th style={ { width: '110px' } }>
							<Skeleton
								variant="text"
								width={ 55 }
								height={ 13 }
							/>
						</th>
						<th style={ { width: '70px', textAlign: 'right' } }>
							<Skeleton
								variant="text"
								width={ 45 }
								height={ 13 }
								style={ { marginLeft: 'auto' } }
							/>
						</th>
					</tr>
				</thead>
				<tbody>
					{ rows.map( ( _, idx ) => (
						<tr key={ idx }>
							<td>
								<Skeleton
									variant="text"
									width={ 115 }
									height={ 13 }
								/>
								<Skeleton
									variant="text"
									width={ 70 }
									height={ 10 }
									style={ { marginTop: '5px', opacity: 0.6 } }
								/>
							</td>
							<td>
								<Skeleton
									variant="text"
									width={ 50 }
									height={ 14 }
								/>
							</td>
							<td>
								<Skeleton
									variant="text"
									width={ `${ 55 + ( ( idx * 13 ) % 35 ) }%` }
									height={ 14 }
								/>
								<Skeleton
									variant="text"
									width={ `${ 35 + ( ( idx * 11 ) % 30 ) }%` }
									height={ 11 }
									style={ { marginTop: '5px', opacity: 0.6 } }
								/>
							</td>
							{ showProviderColumn && (
								<td style={ { textAlign: 'center' } }>
									<Skeleton
										variant="rect"
										width={ 32 }
										height={ 32 }
										borderRadius={ 8 }
										style={ { margin: '0 auto' } }
									/>
								</td>
							) }
							<td>
								<Skeleton
									variant="text"
									width={ 130 }
									height={ 13 }
								/>
								<Skeleton
									variant="text"
									width={ 85 }
									height={ 10 }
									style={ { marginTop: '5px', opacity: 0.6 } }
								/>
							</td>
							<td>
								<Skeleton
									variant="pill"
									width={ 75 }
									height={ 22 }
									borderRadius={ 11 }
								/>
							</td>
							<td style={ { textAlign: 'right' } }>
								<Skeleton
									variant="rect"
									width={ 56 }
									height={ 28 }
									borderRadius={ 6 }
									style={ { marginLeft: 'auto' } }
								/>
							</td>
						</tr>
					) ) }
				</tbody>
			</table>
		</div>
	);
};

export default LogsTableSkeleton;
