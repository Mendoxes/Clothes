
<script>
    import { fade } from 'svelte/transition';
    
    import CheckoutItem from './CheckoutItem.svelte';
    import Firms from './firms.svelte';
    import Nav from './Nav.svelte';
    import Outer from './Outer.svelte';
    import Page from './page.svelte';
    import Carts from "./Carts.svelte"
    import Single from "./single.svelte"
    export let much
    export let op2
    export let boxBelow
    export let op5
    export let ko   ///PRICE FOR AN ITEM 
    export let op4
    export let cart1 
    export let cart2
 
    
    </script>

    <div>ijijijij</div>
   
   <Carts much ={much} op2 ={op2} ko={ko} boxBelow = {boxBelow} op4 = {op4} op5={op5} cart1 ={cart1} cart2 = {cart2}/>