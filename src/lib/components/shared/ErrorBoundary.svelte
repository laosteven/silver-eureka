<script lang="ts">
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = $props<{ fallback?: string; children?: any }>();
  let hasError = $state(false);
  let errorMessage = $state<string | null>(null);

  // Simple boundary: parent passes try/catch errors in via props
  export function showError(message: string) {
    hasError = true;
    errorMessage = message;
  }

  function reset() {
    hasError = false;
    errorMessage = null;
  }
</script>

{#if hasError}
  <div class="rounded-md border border-red-300 bg-red-50 p-4 text-red-800">
    <p class="font-semibold">{p.fallback ?? "Something went wrong."}</p>
    {#if errorMessage}
      <p class="text-sm mt-2">{errorMessage}</p>
    {/if}
    <button class="mt-3 px-3 py-1 rounded bg-red-600 text-white" onclick={reset}>Dismiss</button>
  </div>
{:else}
  {@render p.children?.()}
{/if}
