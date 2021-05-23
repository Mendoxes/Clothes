


<script>
	
	import Nav from "./Nav.svelte"
	import Page from "./page.svelte"
	
	import Carts from "./Carts.svelte"
import Firms from "./firms.svelte"
import Single from "./single.svelte"
import Outer from './Outer.svelte';


// export let much
// export let op2
// export let boxBelow
// export let op5
// // export let ko   ///PRICE FOR AN ITEM 
// export let op4
// export let cart1 
// export let cart2


	let nav = "home";

	function navHandler(event) {
	  nav = event.detail.option;
	 
	}
	function handleMessage(event) {
		alert(event.detail.text);
	}

</script>

<Nav on:nav={navHandler} />
{#if nav === 'home'}
<Page />


{:else if nav === "firms"}
<Firms />

<!-- {:else if nav === "single"} -->

<!-- 
{:else if nav === "carts"}
<Carts much = {much}, op2={op2}, op4 = {op4}, op5 = {op5}, cart1 = {cart1}, cart2 = {cart2}, boxBelow = {boxBelow}/> -->

{/if}

<Outer on:message={handleMessage}/>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>