<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import ButtonGroup from "$lib/components/ui/button-group/button-group.svelte";
  import { ArrowLeft, Eye, SkipForward } from "@lucide/svelte";

  const p = $props<{
    showAnswer: boolean;
    reveal: () => void;
    onCancel: () => void;
    onSkip: () => void;
  }>();
</script>

<div class="flex justify-center gap-4 flex-wrap">
  <ButtonGroup>
    <ButtonGroup>
      <Button
        onclick={p.onCancel}
        variant="outline"
        size="icon"
        title="Go back to question selection"
      >
        <ArrowLeft />
      </Button>
    </ButtonGroup>

    <ButtonGroup>
      <Button onclick={p.onSkip} variant="outline" class="text-red-600" title="Skip question">
        <SkipForward />Skip
      </Button>
      <Button
        onclick={p.reveal}
        disabled={p.showAnswer}
        variant="outline"
        class="text-green-600"
        title="Reveal answer"
      >
        <Eye />
        Answer
      </Button>
    </ButtonGroup>
  </ButtonGroup>
</div>
