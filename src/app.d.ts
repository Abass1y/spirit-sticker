// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		my?: SuperQiSDK;
	}

	interface SuperQiSDK {
		getAuthCode: (options: {
			scopes?: string[];
			success?: (res: { authCode: string }) => void;
			fail?: (err: any) => void;
		}) => void;
		scan: (options: {
			type?: string;
			success?: (res: { code: string }) => void;
			fail?: (err: any) => void;
		}) => void;
		tradePay: (options: {
			paymentUrl: string;
			success?: (res: any) => void;
			fail?: (err: any) => void;
		}) => void;
		alert: (options: {
			title?: string;
			content?: string;
			buttonText?: string;
			success?: () => void;
		}) => void;
	}
}

export { };
