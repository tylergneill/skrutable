import wx
from skrutable.transliteration import Transliterator as Tr
from skrutable.scansion import Scanner as Sc
from skrutable.meter_identification import MeterIdentifier as MtrId
from skrutable.config import load_config_dict_from_json_file

config = load_config_dict_from_json_file()
default_scheme_in = config["default_scheme_in"] # e.g. "auto"
default_scheme_out = config["default_scheme_out"] # e.g. "IAST"
default_frame_size = config["default_gui_frame_size"] # for overall frame
default_resplit_option = config["default_resplit_option"]
default_gui_orientation = config["default_gui_orientation"] # e.g. "left_right"
font_size = config["gui_font_size"] # e.g. 15

W, H = default_frame_size[0], default_frame_size[1]
scheme_choices = ['IAST', 'SLP', 'HK', 'DEV', 'BENGALI', 'GUJARATI', 'VH']
resplit_option_choices = ['none', 'resplit_hard', 'resplit_soft']

class ExamplePanel(wx.Panel):

	def __init__(self, parent):

		wx.Panel.__init__(self, parent)

		self.input_choice = default_scheme_in
		self.output_choice = default_scheme_out
		self.resplit_option_choice = default_resplit_option
		self.buffer = ''
#		self.destroy_spaces_tf = False
		self.T = Tr()
		self.S = Sc()
		self.V = None
		self.MI = MtrId()

		full_font = wx.Font(font_size, wx.MODERN, wx.NORMAL, wx.NORMAL, False, u'Menlo')

		if default_gui_orientation == "left_right":

			self.input_box = wx.TextCtrl(self, pos=(int(0.03*W), int(0.03*H)), size=(int(0.35*W), int(0.65*H)), style=wx.TE_MULTILINE)
			self.input_box.SetFont(full_font)
			self.Bind(wx.EVT_TEXT, self.EvtText, self.input_box)
			self.Bind(wx.EVT_CHAR, self.EvtChar, self.input_box)

			self.output_box = wx.TextCtrl(self, pos=(int(0.40*W), int(0.03*H)), size=(int(0.57*W), int(0.65*H)), style=wx.TE_MULTILINE | wx.TE_READONLY)
			self.output_box.SetFont(full_font)

		elif default_gui_orientation == "top_bottom":

			self.input_box = wx.TextCtrl(self, pos=(int(0.03*W), int(0.05*H)), size=(int(0.94*W), int(0.20*H)), style=wx.TE_MULTILINE)
			self.input_box.SetFont(full_font)
			self.Bind(wx.EVT_TEXT, self.EvtText, self.input_box)
			self.Bind(wx.EVT_CHAR, self.EvtChar, self.input_box)

			self.output_box = wx.TextCtrl(self, pos=(int(0.03*W), int(0.30*H)), size=(int(0.94*W), int(0.40*H)), style=wx.TE_MULTILINE | wx.TE_READONLY)
			self.output_box.SetFont(full_font)

		input_scheme_rb = wx.RadioBox(self, label="Input", pos=(int(0.05*W), int(0.72*H)), choices=scheme_choices, majorDimension=3, style=wx.RA_SPECIFY_COLS)
		self.Bind(wx.EVT_RADIOBOX, self.EvtInSchmRb, input_scheme_rb)

		output_scheme_rb = wx.RadioBox(self, label="Transliteration Output", pos=(int(0.42*W), int(0.72*H)), choices=scheme_choices,  majorDimension=3, style=wx.RA_SPECIFY_COLS)
		self.Bind(wx.EVT_RADIOBOX, self.EvtOutSchmRb, output_scheme_rb)

		resplit_option_rb = wx.RadioBox(self, label="Re-split Option", pos=(int(0.80*W), int(0.85*H)), choices=resplit_option_choices, majorDimension=1, style=wx.RA_SPECIFY_COLS)
		self.Bind(wx.EVT_RADIOBOX, self.EvtRspltOptRb, resplit_option_rb)

		self.transliterate_button = wx.Button(self, label="Transliterate", pos=(int(0.80*W), int(0.72*H)), size=(int(0.10*W), int(0.04*H)))
		self.Bind(wx.EVT_BUTTON, self.EvtTrnslBtn, self.transliterate_button)

		self.scan_button = wx.Button(self, label="Scan", pos=(int(0.80*W), int(0.76*H)), size=(int(0.10*W), int(0.04*H)))
		self.Bind(wx.EVT_BUTTON, self.EvtScanBtn, self.scan_button)

		self.identify_button = wx.Button(self, label="Identify", pos=(int(0.80*W), int(0.80*H)), size=(int(0.10*W), int(0.04*H)))
		self.Bind(wx.EVT_BUTTON, self.EvtIdBtn, self.identify_button)

	def EvtText(self, event):
		self.buffer = event.GetString()
	def EvtChar(self, event):
		self.buffer = event.GetKeyCode()
		event.Skip()

	def EvtInSchmRb(self, event):
		self.input_choice = scheme_choices[event.GetInt()]
	def EvtOutSchmRb(self, event):
		self.output_choice = scheme_choices[event.GetInt()]

	def EvtRspltOptRb(self, event):
		self.resplit_option_choice = resplit_option_choices[event.GetInt()]

	def EvtTrnslBtn(self,event):
		self.output_box.Clear()
		self.output_box.WriteText(self.T.transliterate(self.buffer, from_scheme=self.input_choice, to_scheme=self.output_choice))

	def EvtScanBtn(self,event):
		self.output_box.Clear()
		self.V = self.S.scan(self.buffer, from_scheme=self.input_choice)

		L1 = self.V.morae_per_line
		L2 = self.V.syllable_weights.split('\n')
		L3 = ['['+a+'] '+b for (a,b) in zip([repr(l) for l in L1], L2)]

		self.output_box.WriteText('\n'.join(L3))

		# or just V.summarize()?

	def EvtIdBtn(self,event):
		self.output_box.Clear()
		self.V = self.MI.identify_meter(self.buffer, resplit_option=self.resplit_option_choice, from_scheme=self.input_choice)
		self.output_box.WriteText(self.V.summarize())

app = wx.App(False)
frame = wx.Frame(None, size = (W, H) )
panel = ExamplePanel(frame)
frame.Show()
app.MainLoop()