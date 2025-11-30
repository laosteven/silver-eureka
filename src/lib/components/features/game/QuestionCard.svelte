<script lang="ts">
  import HostQuestionControls from "$lib/components/features/host/HostQuestionControls.svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  const p = $props<{
    question: {
      category: string;
      value: number;
      question: string;
      image?: string;
      youtube?: string;
      answer: string;
    } | null;
    showAnswer: boolean;
    reveal: () => void;
    isVideo: (src: string) => boolean;
    toVideoUrl: (src: string) => string;
    getYoutubeEmbedUrl: (id: string) => string;
    buzzerLocked: boolean;
    onCancel: () => void;
    onSkip: () => void;
  }>();
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-center text-2xl">
      {p.question?.category} - ${p.question?.value}
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    <div class="bg-blue-900 text-white p-8 rounded-lg text-center">
      <p class="text-2xl">{p.question?.question}</p>

      {#if p.question?.image}
        {#if p.isVideo(p.question.image)}
          <video
            src={p.toVideoUrl(p.question.image)}
            autoplay
            loop
            playsinline
            controls
            class="mx-auto mt-4 max-h-64 rounded-lg"
          >
            <track kind="captions" label="Video" default />
          </video>
        {:else}
          <img src={p.question.image} alt="" class="mx-auto mt-4 max-h-64 rounded-lg" />
        {/if}
      {/if}

      {#if p.question?.youtube}
        <div class="mt-4 aspect-video">
          <iframe
            src={p.getYoutubeEmbedUrl(p.question.youtube)}
            title="Question video"
            class="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      {/if}
    </div>

    {#if p.showAnswer}
      <div class="bg-green-100 p-4 rounded-lg">
        <p class="text-sm text-muted-foreground mb-1">Answer:</p>
        <p class="text-xl font-semibold text-green-800">{p.question?.answer}</p>
      </div>
    {/if}

    <div class="mt-6">
      <HostQuestionControls
        showAnswer={p.showAnswer}
        reveal={p.reveal}
        onCancel={p.onCancel}
        onSkip={p.onSkip}
      />
    </div>
  </CardContent>
</Card>
