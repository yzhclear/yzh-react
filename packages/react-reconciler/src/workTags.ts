export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponents
	| typeof HostText;

export const FunctionComponent = 0;
export const HostRoot = 3;

export const HostComponents = 5;
export const HostText = 6;
