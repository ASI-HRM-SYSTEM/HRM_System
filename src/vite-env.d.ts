/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_FEATURE_DASHBOARD?: string;
	readonly VITE_FEATURE_CADER?: string;
	readonly VITE_FEATURE_JOBDESK?: string;
	readonly VITE_FEATURE_EMPLOYEES?: string;
	readonly VITE_FEATURE_LEAVE?: string;
	readonly VITE_FEATURE_ATTENDANCE?: string;
	readonly VITE_FEATURE_PAYROLL?: string;
	readonly VITE_FEATURE_ADMIN?: string;
	readonly VITE_FEATURE_SETTINGS?: string;
	readonly VITE_FEATURE_BACKUP?: string;
	readonly VITE_FEATURE_AUDIT?: string;
	readonly VITE_FEATURE_ABOUT?: string;
	readonly VITE_FEATURE_TERMS?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
