<script lang="ts">
  const p = $props<{
    categories: { name: string; questions: { value: number }[] }[];
    isAnswered: (cat: string, value: number) => boolean;
    onSelect: (cat: string, value: number) => void;
  }>();
</script>

<div class="grid gap-2" style={`grid-template-columns: repeat(${p.categories.length}, 1fr)`}>
  {#each p.categories as category}
    <div
      class="bg-blue-800 text-white p-4 text-center font-bold text-lg rounded-t flex items-center justify-center"
    >
      {category.name}
    </div>
  {/each}

  {#each (Array.from(new Set(p.categories.flatMap( (c: { name: string; questions: { value: number }[] }) => c.questions.map((q: { value: number }) => q.value) ))) as number[]).sort((a, b) => a - b) as value}
    {#each p.categories as category}
      {@const answered = p.isAnswered(category.name, value)}
      <button
        onclick={() => p.onSelect(category.name, value)}
        disabled={answered}
        class="bg-blue-700 text-yellow-300 p-4 text-2xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {answered ? "" : `$${value}`}
      </button>
    {/each}
  {/each}
</div>
