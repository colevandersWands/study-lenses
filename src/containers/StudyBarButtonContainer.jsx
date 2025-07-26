import { useState } from 'preact/hooks';
import styles from './StudyBarButtonContainer.module.css';

/**
 * StudyBarButtonContainer - Renders a lens as a configurable button in the StudyBar
 * Shows lens config options + trigger button that opens lens in modal
 */
const StudyBarButtonContainer = ({ lens, file, onTrigger }) => {
	const [config, setConfig] = useState(lens.config || {});
	const [showConfig, setShowConfig] = useState(false);

	const handleTrigger = () => {
		onTrigger(lens.id, config);
	};

	const handleConfigToggle = (e) => {
		e.stopPropagation();
		setShowConfig(!showConfig);
	};

	return (
		<div className={styles.studyBarButton}>
			<button
				className={styles.lensTrigger}
				onClick={handleTrigger}
				title={lens.config.description}
			>
				{lens.config.icon} {lens.config.label}
			</button>

			{lens.renderConfig && (
				<button
					className={styles.configToggle}
					onClick={handleConfigToggle}
					title="Configure options"
				>
					⚙️
				</button>
			)}

			{showConfig && lens.renderConfig && (
				<div className={styles.configPanel}>
					<div className={styles.configHeader}>
						<span>{lens.config.label} Options</span>
						<button
							className={styles.configClose}
							onClick={() => setShowConfig(false)}
						>
							×
						</button>
					</div>
					<div className={styles.configContent}>
						{lens.renderConfig(config, setConfig)}
					</div>
				</div>
			)}
		</div>
	);
};

export default StudyBarButtonContainer;
