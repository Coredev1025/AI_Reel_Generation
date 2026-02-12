import { getSupabaseAdmin } from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { generateId, parsePagination, buildPagination } from '../utils/helpers';
import { logger } from '../utils/logger';

export class PromptService {
  private db = getSupabaseAdmin();

  async getPrompts(userId: string, query: any): Promise<any> {
    const { page, limit, offset } = parsePagination(query);
    const { search } = query;

    let dbQuery = this.db
      .from('saved_prompts')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (search) {
      dbQuery = dbQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    dbQuery = dbQuery.order('updated_at', { ascending: false });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: prompts, error, count } = await dbQuery;

    if (error) {
      throw new Error('Failed to fetch prompts');
    }

    const pagination = buildPagination(page, limit, count || 0);
    return { prompts: prompts || [], pagination };
  }

  async getPrompt(promptId: string, userId: string): Promise<any> {
    const { data: prompt, error } = await this.db
      .from('saved_prompts')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', userId)
      .single();

    if (error || !prompt) {
      throw new NotFoundError('Prompt');
    }

    return prompt;
  }

  async createPrompt(userId: string, data: { name: string; description: string }): Promise<any> {
    if (!data.name || !data.description) {
      throw new ValidationError('Name and description are required');
    }

    const promptId = generateId();
    const { data: prompt, error } = await this.db
      .from('saved_prompts')
      .insert({
        id: promptId,
        user_id: userId,
        name: data.name,
        description: data.description,
        usage_count: 0,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error('Failed to create prompt');
    }

    logger.info('Prompt created', { promptId, userId });
    return prompt;
  }

  async updatePrompt(promptId: string, userId: string, data: { name?: string; description?: string }): Promise<any> {
    const updates: Record<string, any> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    updates.updated_at = new Date().toISOString();

    const { data: prompt, error } = await this.db
      .from('saved_prompts')
      .update(updates)
      .eq('id', promptId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !prompt) {
      throw new NotFoundError('Prompt');
    }

    return prompt;
  }

  async deletePrompt(promptId: string, userId: string): Promise<void> {
    const { error } = await this.db
      .from('saved_prompts')
      .delete()
      .eq('id', promptId)
      .eq('user_id', userId);

    if (error) {
      throw new NotFoundError('Prompt');
    }

    logger.info('Prompt deleted', { promptId });
  }

  async usePrompt(promptId: string, userId: string): Promise<void> {
    const { data: prompt } = await this.db
      .from('saved_prompts')
      .select('usage_count')
      .eq('id', promptId)
      .eq('user_id', userId)
      .single();

    if (!prompt) {
      throw new NotFoundError('Prompt');
    }

    await this.db
      .from('saved_prompts')
      .update({
        usage_count: (prompt.usage_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promptId);
  }
}

export const promptService = new PromptService();
