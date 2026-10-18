import React from 'react';
import Skeleton from './Skeleton';

/**
 * Modern Skeleton layout for Google Drive file browser table in picker modal.
 */
export const FileListSkeleton = ( { rowsCount = 7 } ) => {
	const rows = Array.from( { length: rowsCount } );

	return (
		<div className="drivevault-filelist-skeleton" aria-busy="true">
			{ /* File list header skeleton */ }
			<div className="drivevault-filelist-skeleton-header">
				<Skeleton
					variant="rect"
					width={ 16 }
					height={ 16 }
					borderRadius={ 3 }
				/>
				<Skeleton variant="text" width={ 120 } height={ 12 } />
				<Skeleton variant="text" width={ 60 } height={ 12 } />
				<Skeleton variant="text" width={ 50 } height={ 12 } />
			</div>

			{ /* File rows */ }
			<div className="drivevault-filelist-skeleton-rows">
				{ rows.map( ( _, idx ) => (
					<div
						key={ idx }
						className="drivevault-filelist-skeleton-row"
					>
						<Skeleton
							variant="rect"
							width={ 16 }
							height={ 16 }
							borderRadius={ 3 }
						/>
						<Skeleton
							variant="rect"
							width={ 22 }
							height={ 22 }
							borderRadius={ 4 }
							className="drivevault-skeleton-file-icon"
						/>
						<div className="drivevault-filelist-skeleton-title">
							<Skeleton
								variant="text"
								width={ `${ Math.min(
									85,
									40 + ( ( idx * 17 ) % 45 )
								) }%` }
								height={ 14 }
							/>
						</div>
						<div className="drivevault-filelist-skeleton-type">
							<Skeleton
								variant="pill"
								width={ idx % 2 === 0 ? 55 : 45 }
								height={ 18 }
								borderRadius={ 9 }
							/>
						</div>
						<div className="drivevault-filelist-skeleton-size">
							<Skeleton
								variant="text"
								width={ idx % 2 === 0 ? 60 : 25 }
								height={ 12 }
							/>
						</div>
					</div>
				) ) }
			</div>
		</div>
	);
};

export default FileListSkeleton;
