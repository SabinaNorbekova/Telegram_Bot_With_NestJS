import { Injectable } from '@nestjs/common';
import { Start, Update, Ctx, Hears, On, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';

@Update()
@Injectable()
export class BotService {
  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      'Welcome to this bot. Select one of the buttons',
      Markup.keyboard([['Assalomu alaykum', 'Inline buttons']]).resize(),
    );
  }

  @Hears('Assalomu alaykum')
  async hearsHello(@Ctx() ctx: Context) {
    await ctx.reply('Va alaykum assalom!');
  }

  @Hears('Inline buttons')
  async showInline(@Ctx() ctx: Context) {
    await ctx.reply(
      'Quyidagilardan tanlang:',
      Markup.inlineKeyboard([
        Markup.button.callback('Button 1', 'action1'),
        Markup.button.callback('Button 2', 'action2'),
      ]),
    );
  }

  @Action('action1')
  async onAction1(@Ctx() ctx: Context) {
    await ctx.reply('Siz Button 1 ni bosdingiz!');
    await ctx.answerCbQuery();
  }

  @Action('action2')
  async onAction2(@Ctx() ctx: Context) {
    await ctx.reply('Siz Button 2 ni bosdingiz!');
    await ctx.answerCbQuery();
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (ctx.message && 'text' in ctx.message) {
      await ctx.reply(`Siz yozgan matn: ${ctx.message.text}`);
    }
  }
}
