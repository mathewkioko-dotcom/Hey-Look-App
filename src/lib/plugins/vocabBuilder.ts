import { HymliPlugin, PluginContext, PluginResponse } from './types';
import { pluginRegistry } from './pluginRegistry';

export interface VocabWord {
  word: string;
  phonetic: string;
  translation: string;
  partOfSpeech: string;
  exampleSentence: string;
  translatedSentence: string;
}

export interface VocabBuilderData {
  targetLanguage: string;
  cefrLevel: string; // e.g., 'B1'
  words: VocabWord[];
}

export const vocabBuilderPlugin: HymliPlugin = {
  id: 'vocab-builder',
  name: 'Language Vocab Builder',
  category: 'learning',
  description: 'Generates vocabulary drill cards with phonetics, translations, and context sentences.',
  icon: 'Languages',
  execute: async (data: VocabBuilderData, context?: PluginContext): Promise<PluginResponse> => {
    return {
      success: true,
      data,
      message: `Generated vocabulary deck for ${data.targetLanguage} (Level ${data.cefrLevel}) with ${data.words?.length || 0} words.`,
    };
  },
};

// Register in plugin registry
pluginRegistry.register(vocabBuilderPlugin);
