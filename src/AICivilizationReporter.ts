// --- FILE: c:\github\三体\src\AICivilizationReporter.ts ---

// 🚨 绝对不要 import { Ai } from '@cloudflare/ai';

export class AICivilizationReporter {
    private ai: any;
    
    constructor(ai: any) {
        this.ai = ai;
    }
    
    async generateExtinctionReport(civilization: {
        name: string;
        birth_time: number;
        extinction_time: number;
        extinction_reason: string;
        fossil_record: string;
    }): Promise<string> {
        const prompt = `# 文明灭绝报告\n\n文明名称: ${civilization.name}\n诞生时间: ${new Date(civilization.birth_time).toISOString()}\n灭绝时间: ${new Date(civilization.extinction_time).toISOString()}\n灭绝原因: ${civilization.extinction_reason}\n化石记录: ${civilization.fossil_record}\n\n请生成一份详细的文明灭绝分析报告，包括：\n1. 文明发展历程简述\n2. 灭绝原因深度分析\n3. 对其他文明的警示\n4. 宇宙意义反思\n\n报告应该客观、深刻，体现对宇宙规律的敬畏。`;
        
        const response = await this.ai.run('@cf/meta/llama-3-8b-instruct', {
            prompt,
            max_tokens: 1000,
            temperature: 0.7
        });
        
        return response.response;
    }
    
    async generateSanityCollapseReport(civilization: {
        name: string;
        current_sanity: number;
        max_sanity: number;
        tech_level: number;
        population: number;
        event: string;
    }): Promise<string> {
        const prompt = `# 文明理智崩溃预警\n\n文明名称: ${civilization.name}\n当前理智: ${civilization.current_sanity}/${civilization.max_sanity}\n科技水平: ${civilization.tech_level}\n人口: ${civilization.population}\n触发事件: ${civilization.event}\n\n请生成一份文明理智崩溃的预警报告，包括：\n1. 理智崩溃的严重程度评估\n2. 可能的社会动荡表现\n3. 紧急干预建议\n4. 长期恢复策略\n\n报告应该专业、冷静，提供可行的解决方案。`;
        
        const response = await this.ai.run('@cf/meta/llama-3-8b-instruct', {
            prompt,
            max_tokens: 800,
            temperature: 0.6
        });
        
        return response.response;
    }
    
    async generateCivilizationSuccessReport(civilization: {
        name: string;
        birth_time: number;
        current_sanity: number;
        tech_level: number;
        population: number;
        achievements: string[];
    }): Promise<string> {
        const prompt = `# 文明成功发展报告\n\n文明名称: ${civilization.name}\n诞生时间: ${new Date(civilization.birth_time).toISOString()}\n当前理智: ${civilization.current_sanity}\n科技水平: ${civilization.tech_level}\n人口: ${civilization.population}\n主要成就: ${civilization.achievements.join(', ')}\n\n请生成一份文明成功发展的分析报告，包括：\n1. 成功因素分析\n2. 发展模式评估\n3. 对宇宙文明的贡献\n4. 未来发展潜力\n\n报告应该积极、客观，展现文明的韧性和智慧。`;
        
        const response = await this.ai.run('@cf/meta/llama-3-8b-instruct', {
            prompt,
            max_tokens: 900,
            temperature: 0.65
        });
        
        return response.response;
    }
}