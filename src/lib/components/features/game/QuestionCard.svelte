<script lang="ts">
  import HostQuestionControls from "$lib/components/features/host/HostQuestionControls.svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { gameConfig } from "$lib/stores/socket";
  import { get } from "svelte/store";
  const p = $props<{
    question: {
      category: string;
      value: number;
      question: string;
      questionImage?: string;
      questionYoutube?: string;
      answer: string;
      answerImage?: string;
      answerYoutube?: string;
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

  let displayedText = $state("");
  let typing = $state(false);
  let showMedia = $state(true);

  // Start typewriter whenever question changes
  $effect(() => {
    const currentQuestion = p.question;
    const cfg = get(gameConfig)?.typewriter || {
      enabled: true,
      speedMsPerChar: 20,
      delayBeforeMediaMs: 300,
    };
    const enabled = cfg.enabled ?? true;
    const speed = cfg.speedMsPerChar ?? 20;
    const delayBeforeMedia = cfg.delayBeforeMediaMs ?? 300;

    displayedText = "";
    showMedia = !enabled; // hide media while typing

    if (!currentQuestion) {
      displayedText = "";
      typing = false;
      showMedia = true;
      return;
    }

    if (!enabled) {
      // If typewriter is disabled, ensure typing state is cleared and media visibility is correct
      typing = false;
      displayedText = currentQuestion.question || "";
      showMedia = true;
      return;
    }

    typing = true;
    let cancelled = false;

    (async () => {
      const full = currentQuestion.question || "";
      for (let i = 0; i <= full.length; i++) {
        if (cancelled) return;
        displayedText = full.slice(0, i);
        await new Promise((r) => setTimeout(r, speed));
      }
      if (cancelled) return;
      typing = false;
      await new Promise((r) => setTimeout(r, delayBeforeMedia));
      if (cancelled) return;
      showMedia = true;
    })();

    return () => {
      cancelled = true;
    };
  });
</script>

<Card>
  <CardHeader>
    <CardTitle class="text-center text-2xl">
      {p.question?.category} - ${p.question?.value}
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    <div class="bg-blue-900 text-white p-8 rounded-lg text-center">
      <p class="text-2xl">{displayedText}{typing ? "|" : ""}</p>

      {#if showMedia && p.question?.questionImage}
        {#if p.isVideo(p.question.questionImage)}
          <video
            src={p.toVideoUrl(p.question.questionImage)}
            autoplay
            loop
            playsinline
            controls
            class="mx-auto mt-4 max-h-64 rounded-lg"
          >
            <track kind="captions" label="Video" default />
          </video>
        {:else}
          <img
            src={p.question.questionImage}
            alt="Question"
            class="mx-auto mt-4 max-h-64 rounded-lg"
          />
        {/if}
      {/if}

      {#if showMedia && p.question?.questionYoutube}
        <div class="mt-4 aspect-video">
          <iframe
            src={p.getYoutubeEmbedUrl(p.question.questionYoutube)}
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
        {#if p.question?.answerImage}
          {#if p.isVideo(p.question.answerImage)}
            <video
              src={p.toVideoUrl(p.question.answerImage)}
              autoplay
              loop
              playsinline
              controls
              class="mx-auto mt-4 max-h-64 rounded-lg"
            >
              <track kind="captions" label="Video" default />
            </video>
          {:else}
            <img
              src={p.question.answerImage}
              alt="Answer"
              class="mx-auto mt-4 max-h-64 rounded-lg"
            />
          {/if}
        {/if}
        {#if p.question?.answerYoutube}
          <div class="mt-4 aspect-video">
            <iframe
              src={p.getYoutubeEmbedUrl(p.question.answerYoutube)}
              title="Answer video"
              class="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        {/if}
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
