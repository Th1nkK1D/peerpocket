const LS_ACTIVE_USER_STORE_ID_KEY = 'ACTIVE_USER_STORE_ID';

export const activeUserStoreId = {
	get() {
		return localStorage.getItem(LS_ACTIVE_USER_STORE_ID_KEY);
	},
	set(storeId: string) {
		localStorage.setItem(LS_ACTIVE_USER_STORE_ID_KEY, storeId);
	},
};
