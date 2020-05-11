import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {HttpClient} from '@angular/common/http';
import {Chapter, HelpLoader} from './help-loader';
import {ConfigReader} from '../../core/configuration/boot/config-reader';
// import {SettingsService} from '../../core/settings/settings-service';
// import {TabManager} from '../../core/tabs/tab-manager';


@Component({
  moduleId: module.id,
  selector: 'help',
  templateUrl: './help.html',
  styleUrls: ['./help.scss'],
  host: {
    '(window:keydown)': 'onKeyDown($event)'
  }
})
/**
 * @author Thomas Kleinke
 */
export class HelpComponent implements OnInit {

  public html: SafeHtml;
  public chapters: Array<Chapter> = [];
  public activeChapter: Chapter;

  @ViewChild('help', {static: false}) rootElement: ElementRef;

  private static scrollOffset: number = -15;
  private static headerTopOffset: number = -62;


  constructor(private domSanitizer: DomSanitizer,
              private http: HttpClient,
              // private settingsService: SettingsService,
              // private tabManager: TabManager

              // TODO take this out,
              private configReader: ConfigReader
  ) {}


  async ngOnInit() {

    // TODO throw away
    this.configReader.read('../src/throwaway.json').then(result => {
      console.log("test", result)
    })

    const {html, chapters} = await HelpLoader.load(
      HelpComponent.getFilePath(
        "de"
        // this.settingsService.getSettings().locale
      ),
      this.http,
      this.domSanitizer
    );

    this.html = html;
    this.chapters = chapters;
    if (this.chapters.length > 0) this.activeChapter = this.chapters[0];
  }


  public async onKeyDown(event: KeyboardEvent) {

    // TODO if (event.key === 'Escape') await this.tabManager.openActiveTab();
  }


  public scrollToChapter(chapter: Chapter) {

    const element: HTMLElement|null = document.getElementById(chapter.id);
    if (!element) return;

    element.scrollIntoView(true);
    this.rootElement.nativeElement.scrollTop += HelpComponent.scrollOffset;
  }


  public updateActiveChapter() {

    let activeElementTop: number = 1;

    this.chapters.forEach(chapter => {
      const top: number = HelpComponent.getHeaderTop(chapter);
      if (top <= 0 && (top > activeElementTop || activeElementTop === 1)) {
        activeElementTop = top;
        this.activeChapter = chapter;
      }
    });
  }


  private static getFilePath(locale: string): string {

    return '../manual/manual.' + locale + '.md';
  }


  private static getHeaderTop(chapter: Chapter): number {

    const element: HTMLElement|null = document.getElementById(chapter.id);
    if (!element) return 1;

    return element.getBoundingClientRect().top
      + HelpComponent.headerTopOffset
      + HelpComponent.scrollOffset;
  }
}
