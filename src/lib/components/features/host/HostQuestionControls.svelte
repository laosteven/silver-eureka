<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Eye from "@lucide/svelte/icons/eye";
  import HeartCrack from "@lucide/svelte/icons/heart-crack";

  const p = $props<{
    showAnswer: boolean;
    reveal: () => void;
    onCancel: () => void;
    onSkip: () => void;
  }>();
</script>

<div class="flex justify-center gap-4 flex-wrap">
  <Button onclick={p.onCancel} variant="outline" title="Go back to question selection">
    <ArrowLeft /> Back
  </Button>

  <Button
    class="text-green-600"
    onclick={p.reveal}
    disabled={p.showAnswer}
    variant="outline"
    title="Reveal answer"
  >
    <Eye />
    Reveal answer
  </Button>

  <Button onclick={p.onSkip} variant="outline" title="Skip question">
    <HeartCrack />Skip
  </Button>
</div>
