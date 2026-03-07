import readline from 'readline';
import { ListService } from '../domain/listService.js';
import { createRepository } from '../infra/repositoryFactory.js';
import { MessengerConsole } from './messengerConsole.js';
import { Debouncer } from './debounce.js';
import { BotHandler } from './botHandler.js';

interface SimulatorState {
  groupId: string;
  userId: string;
}

class WhatsAppSimulator {
  private rl: readline.Interface;
  private state: SimulatorState = {
    groupId: 'casa',
    userId: 'gabu',
  };
  private debouncer: Debouncer;
  private botHandler: BotHandler;
  private listService: ListService;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
    });

    // Simulador sempre usa MEMORY para não poluir o banco
    const repository = createRepository('MEMORY');
    this.listService = new ListService(repository);
    const console = new MessengerConsole();
    this.botHandler = new BotHandler(this.listService, console);

    // Debounce de 1 segundo para agrupar mensagens em sequência
    this.debouncer = new Debouncer(1000);
  }

  start(): void {
    this.printWelcome();
    this.printState();
    this.printHelp();
    this.setupPrompt();
    this.rl.prompt();
  }

  private printWelcome(): void {
    console.log('\n🤖 WhatsApp Shopping List Bot Simulator\n');
    console.log('Digite "help" para ver os comandos disponíveis\n');
  }

  private printState(): void {
    console.log(
      `📌 Grupo: ${this.state.groupId} | Usuário: ${this.state.userId}\n`
    );
  }

  private printHelp(): void {
    console.log('Comandos disponíveis:');
    console.log('  /group <nome>  - Mudar grupo (ex: /group casa)');
    console.log('  /user <nome>   - Mudar usuário (ex: /user mae)');
    console.log('  /help          - Mostrar esta ajuda');
    console.log('  /exit ou /quit - Sair do simulador');
    console.log('\nOu digite mensagens normalmente:');
    console.log('  lista          - Ver lista');
    console.log('  limpar lista   - Limpar lista');
    console.log('  - item         - Remover item');
    console.log('  ✔ item        - Marcar como comprado');
    console.log('  item1         - Adicionar item');
    console.log('  item1\\nitem2  - Adicionar múltiplos itens');
    console.log('');
  }

  private setupPrompt(): void {
    this.rl.on('line', async (input: string) => {
      const trimmed = input.trim();

      if (trimmed === '') {
        this.rl.prompt();
        return;
      }

      // Comandos do simulador
      if (trimmed.startsWith('/')) {
        await this.handleSimulatorCommand(trimmed);
        this.rl.prompt();
        return;
      }

      // Mensagem normal - usa debounce
      this.debouncer.debounce(async () => {
        await this.botHandler.handleMessage({
          text: trimmed,
          groupId: this.state.groupId,
          userId: this.state.userId,
        });
      });

      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\n👋 Até logo!');
      process.exit(0);
    });
  }

  private async handleSimulatorCommand(command: string): Promise<void> {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case '/group':
        if (arg) {
          this.state.groupId = arg;
          console.log(`✅ Grupo alterado para: ${this.state.groupId}`);
        } else {
          console.log('❌ Uso: /group <nome>');
        }
        break;

      case '/user':
        if (arg) {
          this.state.userId = arg;
          console.log(`✅ Usuário alterado para: ${this.state.userId}`);
        } else {
          console.log('❌ Uso: /user <nome>');
        }
        break;

      case '/help':
        this.printHelp();
        break;

      case '/exit':
      case '/quit':
        this.rl.close();
        break;

      default:
        console.log(`❌ Comando desconhecido: ${cmd}`);
        console.log('Digite /help para ver os comandos disponíveis');
    }
  }
}

// Inicia o simulador
const simulator = new WhatsAppSimulator();
simulator.start();
