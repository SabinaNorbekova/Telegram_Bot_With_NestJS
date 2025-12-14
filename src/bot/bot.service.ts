/*
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
*/
import { Injectable } from '@nestjs/common';
import { Action, Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PrismaService } from '../prisma.service';

enum BotStep {
  NAME = 'NAME',
  AGE = 'AGE',
  PHONE = 'PHONE',
  REGION = 'REGION',
  DISTRICT = 'DISTRICT',
  CHANNELS = 'CHANNELS',
  FINISH = 'FINISH',
}

interface UserSession {
  step: BotStep;
  data: {
    name?: string;
    age?: number;
    phone?: string;
    region?: string;
    district?: string;
  };
}

const REGIONS_DATA: Record<string, string[]> = {
  Surxondaryo: [
    'Termiz sh',
    'Angor',
    'Bandixon',
    'Boysun',
    'Denov',
    "Jarqo'rg'on",
    'Muzrabot',
    'Oltinsoy',
    'Qiziriq',
    "Qumqo'rg'on",
    'Sariosiyo',
    'Sherobod',
    "Sho'rchi",
    'Termiz',
    'Uzun',
  ],
  'Toshkent sh': [
    'Bektemir',
    'Chilonzor',
    'Mirobod',
    "Mirzo Ulug'bek",
    'Olmazor',
    'Sergeli',
    'Shayxontohur',
    'Uchtepa',
    'Yakkasaroy',
    'Yashnobod',
    'Yunusobod',
    'Yangihayot',
  ],
  Samarqand: [
    'Samarqand sh',
    "Bulung'ur",
    'Ishtixon',
    'Jomboy',
    "Kattaqo'rg'on",
    'Narpay',
    'Nurobod',
    'Oqdaryo',
    'Paxtachi',
    'Payariq',
    "Pastdarg'om",
    "Qo'shrabot",
    'Samarqand',
    'Toyloq',
    'Urgut',
  ],
  Qashqadaryo: [
    'Qarshi sh',
    'Chiroqchi',
    'Dehqonobod',
    "G'uzor",
    'Kasbi',
    'Kitob',
    'Koson',
    "Ko'kdala",
    'Mirishkor',
    'Muborak',
    'Nishon',
    'Qamashi',
    'Qarshi',
    'Shahrisabz',
    "Yakkabog'",
  ],
  Navoiy: [
    'Navoiy sh',
    'Karmana',
    'Konimex',
    'Navbahor',
    'Nurota',
    'Qiziltepa',
    'Tomdi',
    'Uchquduq',
    'Xatirchi',
  ],
  'Toshkent vil': [
    'Angren',
    'Bekobod',
    "Bo'ka",
    "Bo'stonliq",
    'Chinoz',
    'Ohangaron',
    'Olmaliq',
    "Oqqo'rg'on",
    'Parkent',
    'Piskent',
    'Qibray',
    'Quyi Chirchiq',
    "O'rta Chirchiq",
    "Yangiyo'l",
    'Yuqori Chirchiq',
    'Zangiota',
  ],
  Xorazm: [
    'Urganch sh',
    "Bog'ot",
    'Gurlan',
    'Hazorasp',
    "Qo'shko'pir",
    'Shovot',
    'Urganch',
    'Xiva',
    'Xonqa',
    'Yangiariq',
    'Yangibozor',
    "Tuproqqal'a",
  ],
  Buxoro: [
    'Buxoro sh',
    'Buxoro',
    "G'ijduvon",
    'Jondor',
    'Kogon',
    'Olot',
    'Peshku',
    "Qorako'l",
    'Qorovulbozor',
    'Romitan',
    'Shofirkon',
    'Vobkent',
  ],
  Fargona: [
    "Farg'ona sh",
    "Qo'qon sh",
    'Beshariq',
    "Bog'dod",
    'Buvayda',
    "Dang'ara",
    "Farg'ona",
    'Furqat',
    "O'zbekiston",
    'Oltiariq',
    "Qo'shtepa",
    'Quva',
    'Rishton',
    "So'x",
    'Toshloq',
    "Uchko'prik",
    'Yozyovon',
  ],
  Sirdaryo: [
    'Guliston sh',
    'Boyovut',
    'Guliston',
    'Mirzaobod',
    'Oqoltin',
    'Sardoba',
    'Sayxunobod',
    'Sirdaryo',
    'Xovos',
    'Yangiyer sh',
  ],
  Jizzax: [
    'Jizzax sh',
    'Arnasoy',
    'Baxmal',
    "Do'stlik",
    'Forish',
    "G'allaorol",
    "Mirzach'ol",
    'Paxtakor',
    'Sharof Rashidov',
    'Yangiobod',
    'Zafarobod',
    'Zarbdor',
    'Zomin',
  ],
  Andijon: [
    'Andijon sh',
    'Andijon',
    'Asaka',
    'Baliqchi',
    "Bo'z",
    'Buloqboshi',
    'Izboskan',
    'Jalaquduq',
    'Marhamat',
    "Oltinko'l",
    'Paxtaobod',
    "Qo'rg'ontepa",
    'Shahrixon',
    "Ulug'nor",
    "Xo'jaobod",
  ],
  Namangan: [
    'Namangan sh',
    'Chortoq',
    'Chust',
    'Kosonsoy',
    'Mingbuloq',
    'Namangan',
    'Norin',
    'Pop',
    "To'raqo'rg'on",
    "Uchqo'rg'on",
    'Uychi',
    "Yangiqo'rg'on",
  ],
  Qoraqalpogiston: [
    'Nukus sh',
    'Amudaryo',
    'Beruniy',
    'Chimboy',
    "Ellikqal'a",
    'Kegeyli',
    "Mo'ynoq",
    "Qonliko'l",
    "Qorao'zak",
    "Qo'ng'irot",
    'Shumanay',
    "Taxtako'pir",
    "To'rtko'l",
    "Xo'jayli",
    'Taxiatosh',
    "Bo'zatov",
  ],
};

const REQUIRED_CHANNELS = ['@SN_AboutProgramming', '@sabina1211_study'];

@Update()
@Injectable()
export class BotService {
  private sessions = new Map<number, UserSession>();

  constructor(private prisma: PrismaService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const userId = ctx.from.id;

    const existingUser = await this.prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (existingUser && existingUser.isActive) {
      return ctx.reply(
        `Siz allaqachon ro'yxatdan o'tgansiz, ${existingUser.name}!`,
      );
    }

    this.sessions.set(userId, { step: BotStep.NAME, data: {} });
    await ctx.reply(
      "Assalomu alaykum! Ro'yxatdan o'tish uchun ismingizni kiriting:",
    );
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const userId = ctx.from.id;
    const session = this.sessions.get(userId);
    const text = ctx.message.text;

    if (!session) return;

    switch (session.step) {
      case BotStep.NAME:
        session.data.name = text;
        session.step = BotStep.AGE;
        await ctx.reply('Yoshingizni kiriting (faqat raqam):');
        break;

      case BotStep.AGE:
        const age = parseInt(text);
        if (isNaN(age) || age < 5 || age > 100) {
          await ctx.reply("Iltimos, to'g'ri yosh kiriting (raqamda):");
          return;
        }
        session.data.age = age;
        session.step = BotStep.PHONE;
        await ctx.reply(
          'Telefon raqamingizni yuboring:',
          Markup.keyboard([
            [Markup.button.contactRequest('📞 Telefon raqamni yuborish')],
          ])
            .resize()
            .oneTime(),
        );
        break;
    }
  }

  @On('contact')
  async onContact(@Ctx() ctx: Context) {
    if (!ctx.from || !ctx.message || !('contact' in ctx.message)) return;

    const userId = ctx.from.id;
    const session = this.sessions.get(userId);

    if (session && session.step === BotStep.PHONE) {
      session.data.phone = ctx.message.contact.phone_number;
      session.step = BotStep.REGION;

      const regionButtons = Object.keys(REGIONS_DATA).map((region) =>
        Markup.button.callback(region, `region_${region}`),
      );

      const inlineKeyboard: any[] = [];
      for (let i = 0; i < regionButtons.length; i += 2) {
        inlineKeyboard.push(regionButtons.slice(i, i + 2));
      }

      await ctx.reply(
        'Viloyatingizni tanlang:',
        Markup.inlineKeyboard(inlineKeyboard),
      );
    }
  }

  @Action(/region_(.+)/)
  async onRegionSelect(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const session = this.sessions.get(userId);

    const regionName = (ctx as any).match[1];

    if (session) {
      session.data.region = regionName;
      session.step = BotStep.DISTRICT;

      const districts = REGIONS_DATA[regionName];
      if (!districts) {
        await ctx.reply("Tanlangan viloyat bo'yicha ma'lumot topilmadi.");
        return;
      }

      const districtButtons = districts.map((district) =>
        Markup.button.callback(district, `district_${district}`),
      );

      const inlineKeyboard: any[] = [];
      for (let i = 0; i < districtButtons.length; i += 2) {
        inlineKeyboard.push(districtButtons.slice(i, i + 2));
      }

      await ctx.editMessageText(
        `Tanlangan viloyat: ${regionName}.\nTumaningizni tanlang:`,
        Markup.inlineKeyboard(inlineKeyboard),
      );
    }

    await ctx.answerCbQuery();
  }

  @Action(/district_(.+)/)
  async onDistrictSelect(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const session = this.sessions.get(userId);
    const districtName = (ctx as any).match[1];

    if (session) {
      session.data.district = districtName;
      session.step = BotStep.CHANNELS;

      const channelButtons: any[] = REQUIRED_CHANNELS.map((ch) =>
        Markup.button.url(
          `Kanalga o'tish: ${ch}`,
          `https://t.me/${ch.replace('@', '')}`,
        ),
      );
      channelButtons.push(
        Markup.button.callback('✅ Obunani tekshirish', 'check_subs'),
      );

      await ctx.editMessageText(
        `Ma'lumotlar qabul qilindi. Botdan to'liq foydalanish uchun quyidagi kanallarga obuna bo'ling:`,
        Markup.inlineKeyboard(channelButtons.map((btn) => [btn])),
      );
    }

    await ctx.answerCbQuery();
  }

  @Action('check_subs')
  async onCheckSubs(@Ctx() ctx: Context) {
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const session = this.sessions.get(userId);

    if (!session) {
      await ctx.reply('Sessiya eskirgan. /start ni bosing.');
      return;
    }

    let isSubscribed = true;

    for (const channel of REQUIRED_CHANNELS) {
      try {
        const member = await ctx.telegram.getChatMember(channel, userId);
        if (member.status === 'left' || member.status === 'kicked') {
          isSubscribed = false;
          break;
        }
      } catch (error) {
        console.log(`Kanalga a'zo tekshirishda xato (${channel}):`, error);
        await ctx.reply(
          `Texnik xatolik: Bot ${channel} kanalida admin emas yoki kanal mavjud emas.`,
        );
        return;
      }
    }

    if (isSubscribed) {
      try {
        await this.prisma.user.upsert({
          where: { id: String(userId) },
          update: {
            name: session.data.name,
            age: session.data.age,
            phone: session.data.phone,
            region: session.data.region,
            district: session.data.district,
            isActive: true,
          },
          create: {
            id: String(userId),
            name: session.data.name,
            age: session.data.age,
            phone: session.data.phone,
            region: session.data.region,
            district: session.data.district,
            isActive: true,
          },
        });

        await ctx.deleteMessage();
        await ctx.reply(
          "Tabriklaymiz! Muvaffaqiyatli ro'yxatdan o'tdingiz. 🎉",
        );

        this.sessions.delete(userId);
      } catch (e) {
        console.error(e);
        await ctx.reply('Bazaga yozishda xatolik');
      }
    } else {
      await ctx.reply(
        "Hali hamma kanallarga obuna bo'lmadingiz. Iltimos, qaytadan tekshiring.",
      );
    }

    await ctx.answerCbQuery();
  }
}
