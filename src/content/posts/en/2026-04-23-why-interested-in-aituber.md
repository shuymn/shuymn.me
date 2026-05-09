---
slug: "2026-04-23-why-interested-in-aituber"
locale: "en"
title: "Why I Am Interested in AITubers"
publishedAt: "2026-04-23T00:00:00.000Z"
updatedAt: "2026-05-08T19:16:23.036Z"
draft: false
tags: []
seo:
  title: "Why I Am Interested in AITubers"
  description: "AI personas and AITubers. From trial and error with OpenClaw to observing the community and future predictions."
translation:
  disabled: false
  sourceLocale: "ja"
  sourceSlug: "2026-04-23-why-interested-in-aituber"
  sourceVersion: "a529d6280dd07e2b57455a83b0e3b762fa2d91cc381a4b28dc69f8994ccb0028"
generation:
  sourceHash: "de57afd39c1250d86960a2402c90e93c4e4b2bb3a04fe979a985884cd66d77a5"
  status: "published"
---

I have been interested in AITubers recently, so I want to record why while it's still fresh in my mind.

Technically, I am interested in AI personas and AI personalities, not in the YouTuber activities themselves. However, since the AITuber scene is currently the most active area in Japan for both individuals and companies, I am keeping an eye on that as well.

## Chokaguya-hime and the Internet

I became interested because it was a hot topic on social media, so I watched *Chokaguya-hime*, which was released in theaters in late February. While it is popular in some circles, I couldn't understand what was interesting about it at all. Perhaps my social media timeline was just biased, but seeing nothing but positive opinions immediately after its theater release was a huge shock to me. This wasn't just because the work didn't suit my tastes, but because it made me think, "Has the internet really become a place where works like this are celebrated?"

Even before watching *Chokaguya-hime*, I had a vague sense of discomfort with the atmosphere of the modern internet (i.e., social media). Despite following the VTuber scene, I cannot understand the concept of a "oshi" (a favorite person you support). It's not that I want to say things like, "We are the *real* internet," but the people who were so enthusiastic about *Chokaguya-hime* helped me pinpoint exactly where that feeling of unease was coming from.

## Dreaming of a Lakeside Cottage with OpenClaw

Given these circumstances, I had already been feeling the urge to live away from social media. I couldn't stay away, either due to the need to gather information or—perhaps more truthfully—simply because I was addicted. But I began to realize that this was no longer my place, and my desire to retire from the public, digital eye grew stronger.

Around the same time, I was experimenting with OpenClaw and encountered the mechanism of assigning personas to AI agents using `IDENTITY.md` and `SOUL.md`. I thought, if I use this as an intermediary, I could create a world where I don't have to have direct contact with the internet. Furthermore, I could make that intermediary a character of my own liking. Nothing would make me happier.

## The Ideal and Reality of AI Personas

From there, I spent time exploring OpenClaw and its derivatives, implementing my own, and contemplating what one might call a "harness." OpenClaw cannot perform multi-step LLM calls; it basically operates by giving user questions, `AGENTS.md`, persona files (`IDENTITY.md`/`SOUL.md`), and memory (`MEMORY.md`, etc.) as context to a single LLM invocation. This is perfectly fine for practical tasks like fetching information from the internet or writing code, but it is insufficient for making an AI behave like a character or a personality. So, after some detours, I ended up thinking about whether I could exhibit the desired persona through chat input/output rather than practical use.

However, I am not a technical expert on LLMs, so this is just a guess, but because current high-performance models are all optimized for utility, I couldn't stop them from leaning toward problem-solving with just superficial prompt engineering. While I can correct them slightly with few-shot prompting, it is still limited. As I went through trial and error, I found myself exhausted by the search in the dark, unable to get a sense of "controlling" the LLM's output.

Furthermore, as I messed around with different things, I became obsessed with "what makes it interesting," eventually falling into a state of not even knowing what I wanted—wondering if a middleman really needed to be "interesting" or good at casual conversation.

## Observing AITubers and Their Creators

I decided to stop for a moment, gather information, and study to broaden my knowledge. I then turned my attention to the AITubers I had learned about during my implementation phase. After observing the operators and their communities, I gained the following insights:

- There is more talk about whether they can perform live streams on YouTube than how to craft the character.
- When I actually watched the streams, I could feel the technical effort put into them, but I didn't find them interesting.
  - Although, this is the same with humans, so I don't think AITubers are uniquely boring.
  - You think so too, right?

Unlike simple chatbots, there are many things that AITubers must implement in order to "stream." Because these things can be implemented by individuals given enough time using coding agents, I saw a tendency to be satisfied with the minutiae (in terms of entertainment) before building in invisible things like "wit" or "charm."

To be clear, I'm not trying to criticize existing AITuber creators; I'm simply stating that my expectations were not met, so please don't be offended. Also, I use the term "interesting" (omoshirosa) in contrast to utility; I'm not literally asking the AI to tell me jokes.

I am not interested in having an AI persona stream, but I do feel there is potential to contribute to the community by pursuing things like "interest" and "controlling LLM output in an entertainment-oriented way." There is merit in bringing together talented people with diverse interests to specialize their expertise.

## Future Predictions for AITubers

I don't think AITubers need to stand on the same stage as humans (like VTubers). The biggest differentiator of AI compared to humans—which cannot be overturned—is that identical entities can exist and operate in parallel. I think that should be leveraged. However, doing so bluntly will cause them to lose their scarcity. And if they lose their scarcity, I think they will lose the interest of the public—or more specifically, the desire people have to give Super Chats to get that person's attention. If that happens, AITubers will become like infrastructure, like water from a tap, and won't be able to adopt the same revenue models as humans.

I also believe that as gaming becomes more advanced, it will eventually become indistinguishable from CPU/cheating/TAS, so there's little room for development in just getting better at games. Existing online games, in particular, would likely have issues with AI participating at all, regardless of skill.

I think even existences like Neuro-sama and Shizuku AI currently gain attention as a set with their "master," and in the sense that they cannot gain human interest without a human in the loop, I believe they are a subspecies of VTubers. Since even VTuber projects using AI are being accepted, I think there is a possibility for a timeline where AITuber companies try to run businesses by partnering with humans—treating their company not as an AITuber company, but as a VTuber + AI company entering the industry. I just hope this doesn't lead to a resurgence of the "Big Four VTubers" era.

Also, since I think modern entertainment culture has become heavily tinged with the authoritarianism of "who said it," perhaps influencers from other industries, such as composers (Vocaloid producers) or illustrators, will team up with AITubers to branch out onto YouTube.

I can also understand the argument that AITubers don't need entertainment elements and that they can be used for things like news where being "interesting" isn't required. (I understand it, but I don't want to commit to that.)

Returning to the main point, while I don't think this would work in the real world at all, if we base it on parallelism, we could have a setup like: "The stream (front) is serial," but "Outside of streams (back) is parallel," where fans can interact with individual AI personas (fork), the personas grow through these fan interactions (commit), growth trends are integrated (merge), and various upstreams exist for the same character—it sounds sci-fi and interesting (even if the thinking is too software-engineering oriented). There is no "front" for Miku Hatsune, but I think the mechanism is similar. Yachiyo in *Chokaguya-hime* was also split, so I interpret it as a similar concept. However, as mentioned before, in the current internet, the composition is such that the creator (human) gets more attention than the character, so I don't think people or money will gather for a character on its own, even if it is interesting.

Another strategy is to wait for LLMs aimed at entertainment (which are called Role Play in other countries) to emerge, as current LLMs are already sufficient in terms of practical performance. The reason I don't do that is that I haven't yet cultivated an intuition for input/output in dealing with LLMs outside of coding, and I think that by going through some hardship, I can expand my own capabilities.

## Conclusion

I think it will be difficult to make a business out of pure AITubers at this point in time. But that is only within the context of the modern internet, which I find unpleasant. Conversely, I have high hopes that AI personas could become a last resort for someone like me who feels alienated by that very internet.

I want to use AI as my front-end and quickly retire from the internet where I no longer have a place. And if that AI is a character of my own liking, I would be happy. My goal is to disappear directly from the internet.

Finally, I'm not sure how it looks to be complaining here, but every time I see a self-proclaimed introverted influencer saying things like, "The recent internet has no place for introverts," I think, "You're part of the reason why."
