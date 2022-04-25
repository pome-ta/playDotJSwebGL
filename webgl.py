import sys
import pathlib

import ui

#import pdbg

sys.path.append(str(pathlib.Path.cwd()) + '/pythonista-webview')
from wkwebview import WKWebView

uri = pathlib.Path('./public/index.html')


class View(ui.View):
  def __init__(self, *args, **kwargs):
    ui.View.__init__(self, *args, **kwargs)
    self.wv = WKWebView()
    self.wv.load_url(str(uri))
    self.wv.flex = 'WH'
    self.refresh_webview()
    self.add_subview(self.wv)
    self.set_reload_btn()

  def will_close(self):
    self.refresh_webview()

  def set_reload_btn(self):
    self.close_btn = self.create_btn('iob:ios7_refresh_outline_32')
    self.close_btn.action = (lambda sender: self.refresh_webview())
    self.right_button_items = [self.close_btn]

  def create_btn(self, icon):
    btn_icon = ui.Image.named(icon)
    return ui.ButtonItem(image=btn_icon)

  def refresh_webview(self):
    self.wv.clear_cache()
    self.wv.reload()


if __name__ == '__main__':
  view = View()
  view.present(style='fullscreen', orientations=['portrait'])

