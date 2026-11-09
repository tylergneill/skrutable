import pytest
from unittest.mock import patch

from skrutable.splitting import Splitter

# mock with Dharmamitra Sept 2024 output
@pytest.mark.parametrize("input_string, mock_return_value, expected_output", [
    (
        "tava karakamalasthāṃ sphāṭikīmakṣamālāṃ nakhakiraṇavibhinnāṃ dāḍimībījabuddhyā\npratikalamanukarṣanyena kīro niṣiddhaḥ sa bhavatu mama bhūtyai vāṇi te mandahāsaḥ",
        ['tava kara-kamala-sthām sphāṭikīm akṣamālām nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā', 'pratikalam anukarṣan yena kīraḥ niṣiddhaḥ sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ'],
        "tava kara-kamala-sthām sphāṭikīm akṣamālām nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā\npratikalam anukarṣan yena kīraḥ niṣiddhaḥ sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ"
    ),
    (
        "tava karakamalasthāṃ sphāṭikīmakṣamālāṃ , nakhakiraṇavibhinnāṃ dāḍimībījabuddhyā | pratikalamanukarṣanyena kīro niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te mandahāsaḥ ||",
        ['tava kara-kamala-sthām sphāṭikīm akṣamālām', 'nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā', 'pratikalam anukarṣan yena kīraḥ niṣiddhaḥ', 'sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ'],
        "tava kara-kamala-sthām sphāṭikīm akṣamālām , nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā | pratikalam anukarṣan yena kīraḥ niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ ||")
    ,
    (
        "? tava karakamalasthāṃ sphāṭikīmakṣamālāṃ , nakhakiraṇavibhinnāṃ dāḍimībījabuddhyā | pratikalamanukarṣanyena kīro niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te mandahāsaḥ ||",
        ['tava kara-kamala-sthām sphāṭikīm akṣamālām', 'nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā', 'pratikalam anukarṣan yena kīraḥ niṣiddhaḥ', 'sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ'],
        "? tava kara-kamala-sthām sphāṭikīm akṣamālām , nakha-kiraṇa-vibhinnām dāḍimī-bīja-buddhyā | pratikalam anukarṣan yena kīraḥ niṣiddhaḥ , sa bhavatu mama bhūtyai vāṇi te manda-hāsaḥ ||"
    )
])
@patch('skrutable.splitting.Splitter._get_dharmamitra_split')
def test_restore_punctuation(mock_get_dharmamitra_split, input_string, mock_return_value, expected_output):
    mock_get_dharmamitra_split.return_value = mock_return_value
    Spl = Splitter()
    result = Spl.split(input_string)
    assert result == expected_output


# dandas are kept through splitting; to_scheme conversion follows preserve_dandas
@patch('skrutable.splitting.Splitter._get_dharmamitra_split')
def test_dandas_kept_through_split(mock_get_dharmamitra_split):
    Spl = Splitter()
    for (kwargs, expected_output) in [
        ({}, "tam anuvartate । tam eva ॥"),
        ({'from_scheme': 'DEV'}, "tam anuvartate । tam eva ॥"),
        ({'to_scheme': 'SLP'}, "tam anuvartate | tam eva ||"),
        ({'to_scheme': 'SLP', 'preserve_dandas': True}, "tam anuvartate । tam eva ॥"),
        ({'to_scheme': 'DEV'}, "तमनुवर्तते । तमेव ॥"),
        ({'to_scheme': 'DEV', 'preserve_dandas': True}, "तमनुवर्तते । तमेव ॥"),
    ]:
        mock_get_dharmamitra_split.return_value = ['tam anuvartate', 'tam eva']
        input_string = "तमनुवर्तते । तमेव ॥" if kwargs.get('from_scheme') == 'DEV' else "tamanuvartate । tameva ॥"
        result = Spl.split(input_string, **kwargs)
        assert result == expected_output, f"kwargs={kwargs} expected={expected_output!r} got={result!r}"
