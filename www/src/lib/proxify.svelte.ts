// Wraps a value in $state inside a $derived to produce a deeply reactive proxy.
// Permits mutating methods on values that would otherwise be plain objects/arrays returned by $derived,
// while still re-proxying when the upstream derived invalidates.
export function proxify<T>(value: T): T {
	const proxified = $state(value);
	return proxified;
}
