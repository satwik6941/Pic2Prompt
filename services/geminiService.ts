
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const generateCaption = async (imageBase64: string, imageMimeType: string, triggerWord: string): Promise<string> => {
  try {
    const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
    const textPart = {
      text: `You are an expert AI data labeler specializing in creating high-quality captions for fine-tuning generative image models (like Stable Diffusion, LoRA, or Dreambooth). Your task is to generate a detailed, descriptive caption for the provided image.

The caption MUST start with the special trigger word: "${triggerWord}".

The rest of the caption should be a comma-separated list of descriptive tags and phrases that accurately describe the image content. The goal is to create a caption that allows an AI model to learn the specific subject or style associated with the trigger word.

Analyze the image and break it down into the following components:

1.  **Subject:** Describe the main subject(s) in detail (e.g., "a woman with long brown hair", "a Corgi dog", "a vintage red car").
2.  **Action/Pose:** What is the subject doing? (e.g., "standing", "sitting on a bench", "running through a field", "looking at the camera").
3.  **Attire/Appearance:** Describe clothing, accessories, or key visual features (e.g., "wearing a blue denim jacket", "a white t-shirt", "sunglasses").
4.  **Setting/Background:** Describe the environment (e.g., "in a sunlit forest", "on a city street at night", "in front of a brick wall").
5.  **Composition:** Describe the shot type (e.g., "close-up portrait", "full-body shot", "from above").
6.  **Lighting:** Describe the lighting conditions (e.g., "soft natural light", "dramatic studio lighting", "golden hour").
7.  **Style/Medium:** Describe the overall aesthetic (e.g., "photorealistic", "oil painting", "anime style", "vintage film photo").

Combine these elements into a single line of comma-separated text. Do not use sentences, only tags.

Example:
If the trigger word is "char-groot" and the image is a photo of Groot, a good caption would be:
"char-groot, a tree-like humanoid creature, standing in a forest, full-body shot, detailed bark texture, cinematic lighting, photorealistic"

Now, generate the caption for the image I've provided.`
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating caption:", error);
    throw new Error("Failed to generate caption. Please check the console for details.");
  }
};

export const generateImagePrompt = async (imageBase64: string, imageMimeType: string): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(imageBase64, imageMimeType);
        const textPart = {
            text: `You are an expert prompt engineer for generative image models. Your task is to create a detailed, descriptive text prompt that could be used to generate an image almost identical to the one provided.

Analyze the image and break down all visual elements:
- **Subject:** What is the main subject and its characteristics?
- **Action/Pose:** What is the subject doing?
- **Composition:** How is the shot framed (e.g., close-up, wide shot, rule of thirds)?
- **Setting/Background:** Describe the environment in detail.
- **Lighting:** Describe the quality and direction of light (e.g., golden hour, cinematic lighting, soft shadows).
- **Color Palette:** What are the dominant and accent colors?
- **Style/Medium:** Is it a photograph, painting, 3D render, etc.? What is the aesthetic (e.g., photorealistic, hyperrealistic, anime, impressionistic)?
- **Camera Details:** Mention camera angle, lens type (e.g., macro, telephoto), and aperture effects (e.g., shallow depth of field, bokeh).
- **Mood/Atmosphere:** What feeling does the image evoke (e.g., serene, dramatic, nostalgic)?

Combine these details into a single, cohesive, powerful prompt. The prompt must be a comma-separated list of keywords and descriptive phrases.

**IMPORTANT:** Your response must contain ONLY the prompt text. Do not include any introductory phrases like "Here is your prompt:" or any other explanatory text. Just the prompt.`
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating image prompt:", error);
        throw new Error("Failed to generate image prompt. Please check the console for details.");
    }
};